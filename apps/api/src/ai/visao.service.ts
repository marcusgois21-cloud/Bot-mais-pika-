import { Inject, Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import { PROVEDOR_IA, type ProvedorIA } from './ai.tokens';

export const AnaliseFotoSchema = z.object({
  etapa: z.string().describe('Etapa da obra retratada'),
  legenda: z.string().describe('Legenda técnica para o registro fotográfico'),
  elementos: z.array(z.string()).default([]),
  epi_visivel: z.array(z.string()).default([]),
  risco_seguranca: z.string().nullable().default(null),
  qualidade: z.enum(['boa', 'razoavel', 'ruim']).default('boa'),
});

export type AnaliseFoto = z.infer<typeof AnaliseFotoSchema>;

const INSTRUCAO = `Você analisa fotos de canteiro de obra da construção civil brasileira.

Responda SOMENTE com um JSON válido, sem markdown e sem texto ao redor, no formato:
{
  "etapa": "nome técnico da etapa retratada (ex.: Concretagem de laje, Alvenaria de vedação, Instalação elétrica, Fundação, Acabamento)",
  "legenda": "legenda curta e técnica descrevendo o que a foto mostra",
  "elementos": ["elementos construtivos visíveis"],
  "epi_visivel": ["EPIs identificáveis nas pessoas, se houver pessoas"],
  "risco_seguranca": "descrição do risco visível, ou null se não houver",
  "qualidade": "boa | razoavel | ruim"
}

Regras:
- Descreva apenas o que está visível. Não especule sobre o andamento da obra.
- Se não houver pessoas na foto, epi_visivel deve ser [].
- Aponte risco de segurança apenas quando claramente visível (falta de guarda-corpo, trabalho em altura sem cinto, ausência de capacete, andaime irregular).
- A legenda é para um relatório técnico: objetiva, sem adjetivo.`;

@Injectable()
export class VisaoService {
  private readonly logger = new Logger(VisaoService.name);

  constructor(@Inject(PROVEDOR_IA) private readonly ia: ProvedorIA) {}

  /**
   * Classifica a foto e gera a legenda do registro fotográfico.
   *
   * Falha aqui é degradação, não erro: a foto continua salva e vinculada ao
   * RDO, apenas sem classificação automática. Perder a foto porque o modelo de
   * visão esteve indisponível seria inaceitável.
   */
  async analisar(imagem: Buffer, mimeType: string, contextoObra?: string): Promise<AnaliseFoto> {
    const instrucao = contextoObra
      ? `${INSTRUCAO}\n\nContexto: foto da obra "${contextoObra}".`
      : INSTRUCAO;

    try {
      const bruto = await this.ia.analisarImagem(imagem, mimeType, instrucao);
      const json = this.extrairJson(bruto);
      const validado = AnaliseFotoSchema.safeParse(json);

      if (!validado.success) {
        this.logger.warn('Análise de foto fora do schema — usando padrão.');
        return this.padrao();
      }
      return validado.data;
    } catch (erro) {
      this.logger.error(`Falha ao analisar foto: ${(erro as Error).message}`);
      return this.padrao();
    }
  }

  /**
   * Similaridade entre duas fotos por cosseno dos embeddings.
   *
   * Usado para agrupar fotos da mesma frente de serviço ao longo do tempo e
   * montar a linha de evolução. O embedding em si é gerado no pipeline de
   * mídia e persistido em fotos.embedding (pgvector).
   */
  similaridade(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;

    let produto = 0;
    let normaA = 0;
    let normaB = 0;
    for (let i = 0; i < a.length; i++) {
      produto += a[i] * b[i];
      normaA += a[i] * a[i];
      normaB += b[i] * b[i];
    }
    const divisor = Math.sqrt(normaA) * Math.sqrt(normaB);
    return divisor === 0 ? 0 : produto / divisor;
  }

  /** Modelos às vezes embrulham o JSON em cerca de markdown, mesmo instruídos. */
  private extrairJson(texto: string): unknown {
    const limpo = texto
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    try {
      return JSON.parse(limpo);
    } catch {
      const inicio = limpo.indexOf('{');
      const fim = limpo.lastIndexOf('}');
      if (inicio === -1 || fim <= inicio) return {};
      try {
        return JSON.parse(limpo.slice(inicio, fim + 1));
      } catch {
        return {};
      }
    }
  }

  private padrao(): AnaliseFoto {
    return AnaliseFotoSchema.parse({
      etapa: 'Não classificada',
      legenda: 'Registro fotográfico do canteiro.',
    });
  }
}
