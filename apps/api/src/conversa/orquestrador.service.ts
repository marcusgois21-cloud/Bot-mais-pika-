import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService, TenantClient, UsuarioResolvido } from '../database/database.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { TranscricaoService } from '../ai/transcricao.service';
import { ExtracaoService } from '../ai/extracao.service';
import { VisaoService } from '../ai/visao.service';
import { StorageService } from '../storage/storage.service';
import { RdoRepository } from '../rdo/rdo.repository';
import { EstoqueService, AlertaEstoque } from '../estoque/estoque.service';
import { ConversaService, ContextoConversa } from './conversa.service';
import { MensagemNormalizada } from '../whatsapp/tipos';
import { ExtracaoRDO } from '../ai/esquema';

/**
 * Ponto onde uma mensagem do WhatsApp vira dado de obra.
 *
 * Roteia por tipo de mídia, mantém o estado da conversa e decide entre
 * fechar o RDO ou perguntar o que faltou. É o serviço que materializa a regra
 * central do produto: nada é inventado; o que falta é perguntado.
 */
@Injectable()
export class OrquestradorService {
  private readonly logger = new Logger(OrquestradorService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly whatsapp: WhatsAppService,
    private readonly transcricao: TranscricaoService,
    private readonly extracao: ExtracaoService,
    private readonly visao: VisaoService,
    private readonly storage: StorageService,
    private readonly rdos: RdoRepository,
    private readonly estoque: EstoqueService,
    private readonly conversa: ConversaService,
  ) {}

  async processar(mensagem: MensagemNormalizada): Promise<void> {
    const usuario = await this.db.resolverUsuarioPorTelefone(mensagem.telefone);

    if (!usuario) {
      // Número desconhecido. Resposta genérica de propósito: confirmar ou negar
      // cadastro para um estranho é entregar informação sobre os clientes.
      await this.whatsapp.enviarTexto(
        mensagem.telefone,
        'Olá! Este número atende apenas equipes cadastradas na ObraIA. ' +
          'Fale com o responsável pela sua obra para liberar seu acesso.',
      );
      return;
    }

    await this.whatsapp.marcarComoLida(mensagem.waMessageId);

    await this.db.comTenant(usuario.empresa_id, async (tx) => {
      await this.conversa.registrarMensagem(tx, mensagem.telefone, {
        waMessageId: mensagem.waMessageId,
        direcao: 'entrada',
        tipo: mensagem.tipo,
        conteudo: mensagem.texto ?? mensagem.legenda,
      });

      switch (mensagem.tipo) {
        case 'audio':
          await this.tratarAudio(tx, usuario, mensagem);
          break;
        case 'image':
          await this.tratarImagem(tx, usuario, mensagem);
          break;
        case 'text':
        case 'interactive':
        case 'button':
          await this.tratarTexto(tx, usuario, mensagem);
          break;
        case 'location':
          await this.tratarLocalizacao(tx, usuario, mensagem);
          break;
        default:
          await this.responder(
            tx,
            mensagem.telefone,
            'Consigo trabalhar com áudio, foto, texto e localização. Manda de um desses jeitos que eu registro.',
          );
      }
    });
  }

  // ───────────────────────────── áudio ─────────────────────────────

  private async tratarAudio(
    tx: TenantClient,
    usuario: UsuarioResolvido,
    mensagem: MensagemNormalizada,
  ): Promise<void> {
    if (!mensagem.mediaId) return;

    let registroId: string | null = null;

    try {
      const midia = await this.whatsapp.baixarMidia(mensagem.mediaId);
      const { url } = await this.storage.salvar(midia.buffer, {
        empresaId: usuario.empresa_id,
        tipo: 'audio',
        extensao: 'ogg',
      });

      const registro = await tx.um<{ id: string }>(
        `INSERT INTO registros_voz (empresa_id, usuario_id, wa_message_id, audio_url, status)
         VALUES ($1, $2, $3, $4, 'recebido')
         ON CONFLICT (wa_message_id) DO UPDATE SET audio_url = EXCLUDED.audio_url
         RETURNING id`,
        [usuario.empresa_id, usuario.usuario_id, mensagem.waMessageId, url],
      );
      registroId = registro?.id ?? null;

      const texto = await this.transcricao.transcrever(midia.buffer, midia.mimeType);

      if (registroId) {
        await tx.query(
          `UPDATE registros_voz SET transcricao = $2, status = 'transcrito' WHERE id = $1`,
          [registroId, texto],
        );
      }

      this.logger.log(`Transcrição de ${usuario.nome}: "${texto.slice(0, 120)}"`);
      await this.interpretar(tx, usuario, mensagem.telefone, texto, registroId);
    } catch (erro) {
      const msg = (erro as Error).message;
      this.logger.error(`Falha no áudio de ${usuario.nome}: ${msg}`);

      if (registroId) {
        await tx.query(`UPDATE registros_voz SET status = 'erro', erro = $2 WHERE id = $1`, [
          registroId,
          msg,
        ]);
      }

      await this.responder(
        tx,
        mensagem.telefone,
        'Não consegui entender esse áudio. Pode gravar de novo, ' +
          'de preferência um pouco mais perto da boca e longe do barulho da máquina?',
      );
    }
  }

  // ───────────────────────────── texto ─────────────────────────────

  private async tratarTexto(
    tx: TenantClient,
    usuario: UsuarioResolvido,
    mensagem: MensagemNormalizada,
  ): Promise<void> {
    const texto = (mensagem.texto ?? '').trim();
    if (!texto) return;

    const contexto = await this.conversa.carregar(tx, mensagem.telefone);
    const botao = mensagem.respostaBotao?.id;

    // Clique num botão de escolha de obra.
    if (botao?.startsWith('obra:')) {
      await this.definirObraDoRascunho(tx, usuario, mensagem.telefone, botao.slice(5), contexto);
      return;
    }

    // Resposta a um pedido de compra proposto pela IA.
    if (contexto.estado === 'confirmando_pedido') {
      const confirmou = botao ? botao === 'pedido:sim' : undefined;
      await this.resolverPedido(
        tx,
        usuario,
        mensagem.telefone,
        confirmou === undefined ? texto : confirmou ? 'sim' : 'nao',
        contexto,
      );
      return;
    }

    // Usuário estava escolhendo obra e respondeu por texto ("aurora", "2").
    if (contexto.estado === 'aguardando_obra') {
      const obras = await this.obrasDoUsuario(tx, usuario);
      const porIndice = Number(texto);
      const escolhida =
        (Number.isInteger(porIndice) && obras[porIndice - 1]) ||
        this.extracao.resolverObra(texto, obras);

      if (escolhida) {
        await this.definirObraDoRascunho(tx, usuario, mensagem.telefone, escolhida.id, contexto);
        return;
      }
    }

    if (this.ehComando(texto)) {
      await this.tratarComando(tx, usuario, mensagem.telefone, texto);
      return;
    }

    await this.interpretar(tx, usuario, mensagem.telefone, texto, null);
  }

  // ─────────────────── interpretação e consolidação ────────────────

  /**
   * Núcleo do fluxo: extrai, mescla com o rascunho em curso e decide entre
   * perguntar ou consolidar.
   */
  private async interpretar(
    tx: TenantClient,
    usuario: UsuarioResolvido,
    telefone: string,
    relato: string,
    registroVozId: string | null,
  ): Promise<void> {
    const contexto = await this.conversa.carregar(tx, telefone);
    const obras = await this.obrasDoUsuario(tx, usuario);

    if (!obras.length) {
      await this.responder(
        tx,
        telefone,
        'Você ainda não está vinculado a nenhuma obra. Peça ao engenheiro responsável para te incluir na equipe.',
      );
      return;
    }

    const extraido = await this.extracao.extrair(relato, {
      obrasDisponiveis: obras,
      dataReferencia: new Date(),
      historico: contexto.historico,
    });

    if (extraido.confianca < 0.25 && !extraido.atividades.length) {
      await this.responder(
        tx,
        telefone,
        'Não identifiquei informação de obra nessa mensagem. ' +
          'Me conta o que foi executado hoje — etapa, local e quantidades — que eu monto o RDO.',
      );
      return;
    }

    const rascunho = this.conversa.mesclar(contexto.rascunho, extraido);

    // Obra: contexto da conversa > menção no áudio > obra única do usuário.
    const obra =
      (contexto.obraId ? { id: contexto.obraId, nome: contexto.obraNome ?? '' } : null) ??
      this.extracao.resolverObra(rascunho.obra_mencionada, obras);

    if (!obra) {
      await this.perguntarObra(tx, usuario, telefone, obras, rascunho, registroVozId);
      return;
    }

    // Perguntar antes de gravar: um RDO incompleto publicado é pior que um
    // rascunho aguardando resposta, porque some do radar de quem revisa.
    if (rascunho.campos_pendentes.length > 0) {
      await this.perguntarPendencias(tx, usuario, telefone, obra, rascunho, registroVozId);
      return;
    }

    await this.consolidar(tx, usuario, telefone, obra, rascunho, registroVozId);
  }

  private async perguntarObra(
    tx: TenantClient,
    usuario: UsuarioResolvido,
    telefone: string,
    obras: Array<{ id: string; nome: string }>,
    rascunho: ExtracaoRDO,
    registroVozId: string | null,
  ): Promise<void> {
    const contexto: ContextoConversa = {
      estado: 'aguardando_obra',
      rascunho,
      registroVozId: registroVozId ?? undefined,
      historico: [{ papel: 'assistant', texto: 'Perguntei de qual obra se trata.' }],
    };
    await this.conversa.salvar(tx, telefone, usuario.usuario_id, contexto);

    // Até 3 obras cabem em botões; acima disso, lista em texto.
    if (obras.length <= 3) {
      await this.whatsapp.enviarBotoes(
        telefone,
        'Entendi o relato. De qual obra estamos falando?',
        obras.map((o) => ({ id: `obra:${o.id}`, titulo: o.nome })),
      );
    } else {
      const lista = obras.map((o, i) => `${i + 1}. ${o.nome}`).join('\n');
      await this.whatsapp.enviarTexto(telefone, `Entendi o relato. De qual obra?\n\n${lista}`);
    }
  }

  /**
   * Fixa a obra do rascunho e retoma de onde parou: se ainda há pendências,
   * pergunta; se não, consolida. Sem isso, o usuário teria que repetir todo o
   * relato depois de dizer de qual obra falava.
   */
  private async definirObraDoRascunho(
    tx: TenantClient,
    usuario: UsuarioResolvido,
    telefone: string,
    obraId: string,
    contexto: ContextoConversa,
  ): Promise<void> {
    const obra = await tx.um<{ id: string; nome: string }>(
      `SELECT id, nome FROM obras WHERE id = $1`,
      [obraId],
    );

    if (!obra) {
      await this.responder(tx, telefone, 'Não encontrei essa obra. Pode repetir o nome?');
      return;
    }

    const rascunho = contexto.rascunho;
    if (!rascunho) {
      await this.conversa.salvar(tx, telefone, usuario.usuario_id, {
        estado: 'ocioso',
        obraId: obra.id,
        obraNome: obra.nome,
      });
      await this.responder(tx, telefone, `Certo, obra *${obra.nome}*. Pode mandar o relato.`);
      return;
    }

    if (rascunho.campos_pendentes.length > 0) {
      await this.perguntarPendencias(tx, usuario, telefone, obra, rascunho, contexto.registroVozId ?? null);
      return;
    }

    await this.consolidar(tx, usuario, telefone, obra, rascunho, contexto.registroVozId ?? null);
  }

  private async perguntarPendencias(
    tx: TenantClient,
    usuario: UsuarioResolvido,
    telefone: string,
    obra: { id: string; nome: string },
    rascunho: ExtracaoRDO,
    registroVozId: string | null,
  ): Promise<void> {
    const perguntas = rascunho.campos_pendentes.slice(0, 3);

    const corpo =
      perguntas.length === 1
        ? `Entendido. ${perguntas[0].pergunta}`
        : `Entendido. Pra fechar o RDO de hoje:\n\n${perguntas
            .map((p, i) => `${'1️⃣2️⃣3️⃣'.slice(i * 2, i * 2 + 2)} ${p.pergunta}`)
            .join('\n')}`;

    await this.conversa.salvar(tx, telefone, usuario.usuario_id, {
      estado: 'aguardando_complemento',
      obraId: obra.id,
      obraNome: obra.nome,
      rascunho,
      pendencias: perguntas,
      registroVozId: registroVozId ?? undefined,
      historico: [{ papel: 'assistant', texto: corpo }],
    });

    if (registroVozId) {
      await tx.query(`UPDATE registros_voz SET status = 'aguardando', obra_id = $2 WHERE id = $1`, [
        registroVozId,
        obra.id,
      ]);
    }

    await this.responder(tx, telefone, corpo);
  }

  /**
   * Grava o RDO e tudo que decorre dele: ocorrências, estoque e alertas.
   * Roda dentro da transação do tenant — ou tudo entra, ou nada entra.
   */
  private async consolidar(
    tx: TenantClient,
    usuario: UsuarioResolvido,
    telefone: string,
    obra: { id: string; nome: string },
    dados: ExtracaoRDO,
    registroVozId: string | null,
  ): Promise<void> {
    const data = dados.data ?? new Date().toISOString().slice(0, 10);
    const rdo = await this.rdos.obterOuCriarDoDia(tx, obra.id, data, usuario.usuario_id);

    await this.rdos.aplicarExtracao(tx, rdo.id, dados);
    const ocorrencias = await this.rdos.registrarOcorrencias(tx, rdo.id, obra.id, dados);
    const alertas = await this.estoque.darBaixa(tx, obra.id, rdo.id, dados);
    await this.rdos.publicar(tx, rdo.id);

    if (registroVozId) {
      await tx.query(
        `UPDATE registros_voz
            SET status = 'consolidado', obra_id = $2, entidades = $3
          WHERE id = $1`,
        [registroVozId, obra.id, JSON.stringify(dados)],
      );
    }

    const resumo = this.montarResumo(obra.nome, data, dados, ocorrencias);
    await this.responder(tx, telefone, resumo);

    if (alertas.length) {
      await this.avisarEstoque(tx, usuario, telefone, obra, alertas);
    } else {
      await this.conversa.limpar(tx, telefone, usuario.usuario_id);
    }

    this.logger.log(`RDO ${rdo.id} consolidado (${obra.nome}, ${data}).`);
  }

  private montarResumo(
    obraNome: string,
    data: string,
    dados: ExtracaoRDO,
    ocorrencias: number,
  ): string {
    const [ano, mes, dia] = data.split('-');
    const linhas = [`✅ *RDO ${dia}/${mes}/${ano} registrado* — ${obraNome}`, ''];

    for (const atividade of dados.atividades) {
      const partes = [atividade.etapa];
      if (atividade.local) partes.push(atividade.local);
      if (atividade.quantidade !== null) {
        partes.push(`${atividade.quantidade}${atividade.unidade ? ` ${atividade.unidade}` : ''}`);
      }
      linhas.push(`• ${partes.join(' — ')}`);
    }

    const materiais = dados.materiais.filter((m) => m.quantidade !== null);
    if (materiais.length) {
      linhas.push('', '📦 Materiais:');
      for (const m of materiais) {
        linhas.push(`• ${m.nome}: ${m.quantidade}${m.unidade ? ` ${m.unidade}` : ''}`);
      }
    }

    const efetivo = dados.mao_de_obra.reduce((s, m) => s + m.quantidade, 0);
    if (efetivo > 0) linhas.push('', `👷 Efetivo: ${efetivo}`);
    if (ocorrencias > 0) linhas.push(`⚠️ ${ocorrencias} ocorrência(s) registrada(s)`);

    if (dados.proximas_atividades.length) {
      linhas.push('', `➡️ Próximas: ${dados.proximas_atividades.join(', ')}`);
    }

    return linhas.join('\n');
  }

  // ──────────────────────────── estoque ────────────────────────────

  private async avisarEstoque(
    tx: TenantClient,
    usuario: UsuarioResolvido,
    telefone: string,
    obra: { id: string; nome: string },
    alertas: AlertaEstoque[],
  ): Promise<void> {
    const lista = alertas
      .map((a) => `• ${a.material}: ${a.saldo} ${a.unidade} (mínimo ${a.minimo})`)
      .join('\n');

    await this.conversa.salvar(tx, telefone, usuario.usuario_id, {
      estado: 'confirmando_pedido',
      obraId: obra.id,
      obraNome: obra.nome,
      pedidoAlertas: alertas,
    });

    await this.whatsapp.enviarBotoes(
      telefone,
      `⚠️ *Estoque abaixo do mínimo* — ${obra.nome}\n\n${lista}\n\nGero o pedido de compra?`,
      [
        { id: 'pedido:sim', titulo: 'Gerar pedido' },
        { id: 'pedido:nao', titulo: 'Agora não' },
      ],
    );
  }

  private async resolverPedido(
    tx: TenantClient,
    usuario: UsuarioResolvido,
    telefone: string,
    resposta: string,
    contexto: ContextoConversa,
  ): Promise<void> {
    const positivo = /^(sim|s|ok|pode|gerar|gera|isso|claro|manda|beleza|blz|1)/i.test(
      resposta.trim(),
    );

    if (!positivo) {
      await this.conversa.limpar(tx, telefone, usuario.usuario_id);
      await this.responder(tx, telefone, 'Certo, não vou gerar o pedido. Só chamar quando precisar.');
      return;
    }

    const pedido = await this.estoque.gerarPedido(
      tx,
      contexto.obraId!,
      usuario.usuario_id,
      contexto.pedidoAlertas ?? [],
    );

    await this.conversa.limpar(tx, telefone, usuario.usuario_id);
    await this.responder(
      tx,
      telefone,
      pedido
        ? `📤 Pedido *#${pedido.numero}* criado e enviado para suprimentos. ` +
            'Ele aparece no painel para aprovação.'
        : 'Não consegui montar o pedido agora. Avise o almoxarifado pelo painel.',
    );
  }

  // ───────────────────────────── imagem ────────────────────────────

  private async tratarImagem(
    tx: TenantClient,
    usuario: UsuarioResolvido,
    mensagem: MensagemNormalizada,
  ): Promise<void> {
    if (!mensagem.mediaId) return;

    try {
      const midia = await this.whatsapp.baixarMidia(mensagem.mediaId);
      const { url } = await this.storage.salvar(midia.buffer, {
        empresaId: usuario.empresa_id,
        tipo: 'foto',
        extensao: midia.mimeType.includes('png') ? 'png' : 'jpg',
      });

      const contexto = await this.conversa.carregar(tx, mensagem.telefone);
      const obras = await this.obrasDoUsuario(tx, usuario);
      const obraId = contexto.obraId ?? (obras.length === 1 ? obras[0].id : null);
      const obraNome = contexto.obraNome ?? obras.find((o) => o.id === obraId)?.nome;

      const analise = await this.visao.analisar(midia.buffer, midia.mimeType, obraNome);

      // Vincula ao RDO do dia quando a obra é conhecida — assim a foto entra no
      // registro fotográfico do relatório, não numa galeria solta.
      let rdoId: string | null = null;
      if (obraId) {
        const hoje = new Date().toISOString().slice(0, 10);
        const rdo = await this.rdos.obterOuCriarDoDia(tx, obraId, hoje, usuario.usuario_id);
        rdoId = rdo.id;
      }

      await tx.query(
        `INSERT INTO fotos (empresa_id, obra_id, rdo_id, usuario_id, wa_message_id, url, etapa, legenda, analise)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (wa_message_id) DO NOTHING`,
        [
          usuario.empresa_id,
          obraId,
          rdoId,
          usuario.usuario_id,
          mensagem.waMessageId,
          url,
          analise.etapa,
          mensagem.legenda ?? analise.legenda,
          JSON.stringify(analise),
        ],
      );

      // Risco visível na foto vira ocorrência de segurança automaticamente.
      // Deixar isso só na legenda seria perder o registro que a fiscalização cobra.
      if (analise.risco_seguranca && obraId) {
        await tx.query(
          `INSERT INTO ocorrencias (empresa_id, obra_id, rdo_id, tipo, gravidade, descricao)
           VALUES ($1, $2, $3, 'seguranca', 'media', $4)`,
          [usuario.empresa_id, obraId, rdoId, `Identificado na foto: ${analise.risco_seguranca}`],
        );
      }

      const partes = [`📸 Foto registrada — *${analise.etapa}*`, analise.legenda];
      if (!obraId) partes.push('\n_Me diga de qual obra é para eu anexar ao RDO._');
      if (analise.risco_seguranca) {
        partes.push(`\n⚠️ *Atenção à segurança:* ${analise.risco_seguranca}`);
      }

      await this.responder(tx, mensagem.telefone, partes.join('\n'));
    } catch (erro) {
      this.logger.error(`Falha ao processar foto: ${(erro as Error).message}`);
      await this.responder(
        tx,
        mensagem.telefone,
        'Não consegui processar essa foto. Pode reenviar?',
      );
    }
  }

  private async tratarLocalizacao(
    tx: TenantClient,
    usuario: UsuarioResolvido,
    mensagem: MensagemNormalizada,
  ): Promise<void> {
    if (!mensagem.localizacao) return;

    const contexto = await this.conversa.carregar(tx, mensagem.telefone);
    const obras = await this.obrasDoUsuario(tx, usuario);
    const obraId = contexto.obraId ?? (obras.length === 1 ? obras[0].id : null);

    if (!obraId) {
      await this.responder(tx, mensagem.telefone, 'Recebi a localização. De qual obra ela é?');
      return;
    }

    await tx.query(
      `UPDATE obras SET latitude = $2, longitude = $3,
              endereco = COALESCE(endereco, $4)
        WHERE id = $1`,
      [
        obraId,
        mensagem.localizacao.latitude,
        mensagem.localizacao.longitude,
        mensagem.localizacao.endereco ?? null,
      ],
    );

    await this.responder(tx, mensagem.telefone, '📍 Localização da obra atualizada.');
  }

  // ──────────────────────────── comandos ───────────────────────────

  private ehComando(texto: string): boolean {
    return /^(\/|ajuda|menu|status|resumo|estoque|obras)\b/i.test(texto.trim());
  }

  private async tratarComando(
    tx: TenantClient,
    usuario: UsuarioResolvido,
    telefone: string,
    texto: string,
  ): Promise<void> {
    const comando = texto.replace(/^\//, '').trim().toLowerCase();
    const obras = await this.obrasDoUsuario(tx, usuario);

    if (/^(ajuda|menu|help)/.test(comando)) {
      await this.responder(
        tx,
        telefone,
        [
          '*ObraIA* — como usar',
          '',
          '🎙️ *Áudio* — conte o que foi feito e eu monto o RDO.',
          '   _"hoje concretamos a laje do bloco B, 12 metros de concreto"_',
          '',
          '📸 *Foto* — eu classifico a etapa e anexo ao relatório.',
          '📍 *Localização* — atualiza o endereço da obra.',
          '',
          'Comandos:',
          '• *obras* — suas obras',
          '• *estoque* — saldo de materiais',
          '• *status* — resumo da obra',
        ].join('\n'),
      );
      return;
    }

    if (/^obras/.test(comando)) {
      await this.responder(
        tx,
        telefone,
        obras.length
          ? `*Suas obras:*\n${obras.map((o) => `• ${o.nome}`).join('\n')}`
          : 'Você ainda não está vinculado a nenhuma obra.',
      );
      return;
    }

    if (/^estoque/.test(comando)) {
      const obraId = obras.length === 1 ? obras[0].id : null;
      if (!obraId) {
        await this.responder(tx, telefone, 'De qual obra você quer ver o estoque?');
        return;
      }
      const saldos = await this.estoque.saldosDaObra(tx, obraId);
      const linhas = saldos.map(
        (s) => `${s.abaixo_minimo ? '⚠️' : '•'} ${s.nome}: ${s.saldo} ${s.unidade}`,
      );
      await this.responder(
        tx,
        telefone,
        linhas.length ? `*Estoque — ${obras[0].nome}*\n${linhas.join('\n')}` : 'Sem movimentação de estoque registrada.',
      );
      return;
    }

    if (/^(status|resumo)/.test(comando)) {
      const obraId = obras.length === 1 ? obras[0].id : null;
      if (!obraId) {
        await this.responder(tx, telefone, 'De qual obra você quer o resumo?');
        return;
      }
      const resumo = await tx.um<{ total: string; ultima: string | null; pendentes: string }>(
        `SELECT count(*)::text AS total,
                max(data)::text AS ultima,
                count(*) FILTER (WHERE status = 'rascunho')::text AS pendentes
           FROM rdos WHERE obra_id = $1`,
        [obraId],
      );
      await this.responder(
        tx,
        telefone,
        [
          `*${obras[0].nome}*`,
          `RDOs registrados: ${resumo?.total ?? 0}`,
          `Último: ${resumo?.ultima ?? '—'}`,
          `Em rascunho: ${resumo?.pendentes ?? 0}`,
        ].join('\n'),
      );
    }
  }

  // ───────────────────────────── apoio ─────────────────────────────

  private async obrasDoUsuario(
    tx: TenantClient,
    usuario: UsuarioResolvido,
  ): Promise<Array<{ id: string; nome: string; apelidos: string[] }>> {
    // Gestor e engenheiro enxergam toda a empresa; os demais, só as obras
    // em que foram alocados. É o mesmo recorte de permissão do painel.
    const amplo = usuario.perfil === 'gestor' || usuario.perfil === 'engenheiro';

    return amplo
      ? tx.query(
          `SELECT id, nome, apelidos FROM obras
            WHERE status IN ('em_andamento','planejamento') ORDER BY nome`,
        )
      : tx.query(
          `SELECT o.id, o.nome, o.apelidos
             FROM obras o
             JOIN obra_equipe e ON e.obra_id = o.id
            WHERE e.usuario_id = $1 AND o.status IN ('em_andamento','planejamento')
            ORDER BY o.nome`,
          [usuario.usuario_id],
        );
  }

  private async responder(tx: TenantClient, telefone: string, texto: string): Promise<void> {
    const id = await this.whatsapp.enviarTexto(telefone, texto);
    await this.conversa.registrarMensagem(tx, telefone, {
      waMessageId: id ?? undefined,
      direcao: 'saida',
      tipo: 'text',
      conteudo: texto,
    });
  }
}
