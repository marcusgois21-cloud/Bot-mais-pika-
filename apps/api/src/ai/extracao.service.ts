import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  ExtracaoRDO,
  ExtracaoRDOSchema,
  FUNCTION_EXTRAIR_RDO,
  PROMPT_EXTRACAO,
} from './esquema';
import { PROVEDOR_IA, type ProvedorIA } from './ai.tokens';

export interface ContextoExtracao {
  /** Obras que o usuário pode registrar, com apelidos usados no canteiro. */
  obrasDisponiveis: Array<{ id: string; nome: string; apelidos: string[] }>;
  /** Data de referência para resolver "hoje", "ontem". */
  dataReferencia: Date;
  /** Turnos anteriores da conversa, quando a IA está completando um rascunho. */
  historico?: Array<{ papel: 'user' | 'assistant'; texto: string }>;
}

@Injectable()
export class ExtracaoService {
  private readonly logger = new Logger(ExtracaoService.name);

  constructor(@Inject(PROVEDOR_IA) private readonly ia: ProvedorIA) {}

  /**
   * Converte relato em linguagem natural no objeto estruturado do RDO.
   *
   * Se o modelo devolver algo fora do schema, a extração falha de forma
   * explícita — preferimos pedir para o usuário repetir a mandar dado torto
   * para dentro do relatório.
   */
  async extrair(relato: string, contexto: ContextoExtracao): Promise<ExtracaoRDO> {
    const mensagens = [
      ...(contexto.historico ?? []),
      { papel: 'user' as const, texto: relato },
    ];

    const chamada = await this.ia.chamarComFuncao(
      this.montarPrompt(contexto),
      mensagens,
      FUNCTION_EXTRAIR_RDO as unknown as Record<string, unknown>,
    );

    if (!chamada) {
      this.logger.warn('Modelo não retornou chamada de função para o relato.');
      return this.vazio();
    }

    const validado = ExtracaoRDOSchema.safeParse(chamada.argumentos);
    if (!validado.success) {
      this.logger.error(
        `Extração fora do schema: ${validado.error.issues.map((i) => i.path.join('.')).join(', ')}`,
      );
      return this.vazio();
    }

    return validado.data;
  }

  /**
   * Resolve a obra citada no áudio contra as obras do usuário.
   *
   * Casamento por nome e apelido, sem acento e sem caixa: no canteiro ninguém
   * fala "Residencial Aurora" — fala "aurora", "obra do aurora". Se houver
   * ambiguidade, devolvemos null e o chamador pergunta em vez de chutar.
   */
  resolverObra(
    mencao: string | null,
    obras: ContextoExtracao['obrasDisponiveis'],
  ): { id: string; nome: string } | null {
    if (obras.length === 1) return obras[0]; // sem ambiguidade possível
    if (!mencao) return null;

    const alvo = this.normalizar(mencao);

    const candidatas = obras.filter((o) => {
      const nome = this.normalizar(o.nome);
      if (nome === alvo || nome.includes(alvo) || alvo.includes(nome)) return true;
      return o.apelidos.some((a) => {
        const ap = this.normalizar(a);
        return ap === alvo || alvo.includes(ap);
      });
    });

    // Duas obras batem com o mesmo termo: perguntar é mais barato que errar o
    // RDO de obra e ter que desfazer estoque, custo e cronograma depois.
    return candidatas.length === 1 ? { id: candidatas[0].id, nome: candidatas[0].nome } : null;
  }

  private montarPrompt(contexto: ContextoExtracao): string {
    const lista = contexto.obrasDisponiveis
      .map((o) => `- ${o.nome}${o.apelidos.length ? ` (também chamada de: ${o.apelidos.join(', ')})` : ''}`)
      .join('\n');

    return [
      PROMPT_EXTRACAO,
      '',
      `DATA DE REFERÊNCIA: ${contexto.dataReferencia.toISOString().slice(0, 10)}`,
      '',
      contexto.obrasDisponiveis.length
        ? `OBRAS DESTE USUÁRIO:\n${lista}\n\nUse exatamente um destes nomes em obra_mencionada quando reconhecer a obra. Se o relato não permitir identificar com segurança qual é, deixe null e inclua "obra" em campos_pendentes.`
        : 'O usuário não tem obras cadastradas.',
    ].join('\n');
  }

  private normalizar(texto: string): string {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove acentos (combining marks)
      .replace(/[^a-z0-9\s]/g, '')
      .trim();
  }

  private vazio(): ExtracaoRDO {
    return ExtracaoRDOSchema.parse({
      obra_mencionada: null,
      data: null,
      clima: null,
      horas_trabalhadas: null,
      observacoes: null,
      confianca: 0,
    });
  }
}
