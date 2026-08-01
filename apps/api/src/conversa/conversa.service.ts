import { Injectable } from '@nestjs/common';
import { DatabaseService, TenantClient } from '../database/database.service';
import { ExtracaoRDO } from '../ai/esquema';

/**
 * Estado da conversa com um usuário no WhatsApp.
 *
 * Existe porque o registro de obra raramente cabe numa mensagem só: o mestre
 * fala o essencial, a IA pergunta o que faltou, ele responde. Sem estado, a
 * segunda mensagem chegaria sem saber a que a resposta se refere.
 */
export type EstadoConversa =
  | 'ocioso'
  | 'aguardando_complemento' // IA perguntou algo sobre um rascunho
  | 'confirmando_pedido' // IA propôs pedido de compra e espera sim/não
  | 'aguardando_obra'; // usuário precisa dizer de qual obra fala

export interface ContextoConversa {
  estado: EstadoConversa;
  obraId?: string;
  obraNome?: string;
  rdoId?: string;
  registroVozId?: string;
  /** Extração parcial acumulada entre turnos. */
  rascunho?: ExtracaoRDO;
  /** Perguntas ainda sem resposta. */
  pendencias?: Array<{ campo: string; pergunta: string }>;
  /** Últimos turnos, para o LLM entender a resposta curta ("bloco B, 12"). */
  historico?: Array<{ papel: 'user' | 'assistant'; texto: string }>;
  pedidoAlertas?: Array<{ material: string; saldo: number; minimo: number; unidade: string }>;
  atualizadoEm?: string;
}

const CONTEXTO_INICIAL: ContextoConversa = { estado: 'ocioso' };

/** Depois disso, uma resposta solta provavelmente é assunto novo, não complemento. */
const VALIDADE_MINUTOS = 30;

@Injectable()
export class ConversaService {
  constructor(private readonly db: DatabaseService) {}

  async carregar(tx: TenantClient, telefone: string): Promise<ContextoConversa> {
    const linha = await tx.um<{ contexto: ContextoConversa }>(
      `SELECT contexto FROM conversas WHERE telefone = $1`,
      [telefone],
    );

    const contexto = linha?.contexto ?? CONTEXTO_INICIAL;

    // Contexto velho é pior que contexto nenhum: encaixar a resposta de hoje
    // num rascunho de ontem produz um RDO errado e difícil de rastrear.
    if (contexto.atualizadoEm) {
      const idade = (Date.now() - new Date(contexto.atualizadoEm).getTime()) / 60_000;
      if (idade > VALIDADE_MINUTOS) return { ...CONTEXTO_INICIAL };
    }

    return contexto;
  }

  async salvar(
    tx: TenantClient,
    telefone: string,
    usuarioId: string | null,
    contexto: ContextoConversa,
  ): Promise<void> {
    const comCarimbo: ContextoConversa = {
      ...contexto,
      atualizadoEm: new Date().toISOString(),
      // Guardar a conversa inteira não ajuda e pesa no JSONB.
      historico: (contexto.historico ?? []).slice(-6),
    };

    await tx.query(
      `INSERT INTO conversas (empresa_id, usuario_id, telefone, contexto, atualizado_em)
       VALUES ($1, $2, $3, $4, now())
       ON CONFLICT (telefone) DO UPDATE
         SET contexto = $4, atualizado_em = now(), usuario_id = COALESCE($2, conversas.usuario_id)`,
      [tx.empresaId, usuarioId, telefone, JSON.stringify(comCarimbo)],
    );
  }

  async limpar(tx: TenantClient, telefone: string, usuarioId: string | null): Promise<void> {
    await this.salvar(tx, telefone, usuarioId, { ...CONTEXTO_INICIAL });
  }

  /** Registra a mensagem para o histórico exibido no painel. */
  async registrarMensagem(
    tx: TenantClient,
    telefone: string,
    dados: {
      waMessageId?: string;
      direcao: 'entrada' | 'saida';
      tipo: string;
      conteudo?: string;
      mediaUrl?: string;
    },
  ): Promise<void> {
    const conversa = await tx.um<{ id: string }>(
      `SELECT id FROM conversas WHERE telefone = $1`,
      [telefone],
    );

    await tx.query(
      `INSERT INTO mensagens (empresa_id, conversa_id, wa_message_id, direcao, tipo, conteudo, media_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (wa_message_id) DO NOTHING`,
      [
        tx.empresaId,
        conversa?.id ?? null,
        dados.waMessageId ?? null,
        dados.direcao,
        dados.tipo,
        dados.conteudo ?? null,
        dados.mediaUrl ?? null,
      ],
    );
  }

  /**
   * Mescla a nova extração no rascunho acumulado.
   *
   * Listas se somam (o dia tem várias atividades); escalares só entram se
   * ainda estiverem vazios, para a resposta de complemento não apagar o que o
   * primeiro áudio já trouxe.
   */
  mesclar(anterior: ExtracaoRDO | undefined, novo: ExtracaoRDO): ExtracaoRDO {
    if (!anterior) return novo;

    return {
      ...anterior,
      obra_mencionada: anterior.obra_mencionada ?? novo.obra_mencionada,
      data: anterior.data ?? novo.data,
      clima: anterior.clima ?? novo.clima,
      horas_trabalhadas: anterior.horas_trabalhadas ?? novo.horas_trabalhadas,
      observacoes: anterior.observacoes ?? novo.observacoes,
      atividades: this.unirAtividades(anterior.atividades, novo.atividades),
      materiais: this.unirMateriais(anterior.materiais, novo.materiais),
      equipamentos: [...new Set([...anterior.equipamentos, ...novo.equipamentos])],
      mao_de_obra: novo.mao_de_obra.length ? novo.mao_de_obra : anterior.mao_de_obra,
      ocorrencias: [...anterior.ocorrencias, ...novo.ocorrencias],
      proximas_atividades: [
        ...new Set([...anterior.proximas_atividades, ...novo.proximas_atividades]),
      ],
      campos_pendentes: novo.campos_pendentes,
      confianca: Math.max(anterior.confianca, novo.confianca),
    };
  }

  /**
   * A resposta de complemento normalmente repete a etapa ("bloco B da laje").
   * Sem esta união, o RDO ficaria com a mesma atividade duas vezes — uma
   * incompleta e outra completa.
   */
  private unirAtividades(
    anteriores: ExtracaoRDO['atividades'],
    novas: ExtracaoRDO['atividades'],
  ): ExtracaoRDO['atividades'] {
    const resultado = [...anteriores];

    for (const nova of novas) {
      const chave = nova.etapa.toLowerCase().trim();
      const existente = resultado.find((a) => a.etapa.toLowerCase().trim() === chave);

      if (existente) {
        existente.local = existente.local ?? nova.local;
        existente.descricao = existente.descricao ?? nova.descricao;
        existente.quantidade = existente.quantidade ?? nova.quantidade;
        existente.unidade = existente.unidade ?? nova.unidade;
      } else {
        resultado.push(nova);
      }
    }
    return resultado;
  }

  private unirMateriais(
    anteriores: ExtracaoRDO['materiais'],
    novos: ExtracaoRDO['materiais'],
  ): ExtracaoRDO['materiais'] {
    const resultado = [...anteriores];

    for (const novo of novos) {
      const chave = novo.nome.toLowerCase().trim();
      const existente = resultado.find((m) => m.nome.toLowerCase().trim() === chave);

      if (existente) {
        // "usamos concreto" + "foram 12 metros" = um material com quantidade.
        existente.quantidade = existente.quantidade ?? novo.quantidade;
        existente.unidade = existente.unidade ?? novo.unidade;
      } else {
        resultado.push(novo);
      }
    }
    return resultado;
  }
}
