import { z } from 'zod';

/**
 * Contrato de extração do RDO.
 *
 * O LLM não devolve texto livre para o sistema — devolve este objeto, validado
 * por schema. Duas consequências práticas:
 *
 *  1. O RDO é sempre estruturado, então vira linha de banco sem parsing frágil.
 *  2. `campos_pendentes` é o que dispara a pergunta de volta ao usuário. É o
 *     mecanismo que sustenta a regra central do produto: a IA pergunta, ela
 *     não estima. Um RDO é documento técnico e às vezes jurídico; um volume de
 *     concreto "provável" é pior que um campo vazio.
 */

/**
 * Campo que pode vir null OU simplesmente não vir.
 *
 * O function schema marca poucos campos como obrigatórios, então o modelo
 * legitimamente omite o que não se aplica. Exigir a chave presente faria a
 * validação rejeitar uma extração boa — e o usuário perderia o RDO por causa
 * de um `clima` ausente. Ausente e null significam a mesma coisa aqui: não foi
 * dito.
 */
const textoOpcional = (descricao?: string) =>
  descricao ? z.string().nullish().default(null).describe(descricao) : z.string().nullish().default(null);

const numeroOpcional = (descricao?: string) =>
  descricao ? z.number().nullish().default(null).describe(descricao) : z.number().nullish().default(null);

export const MaterialSchema = z.object({
  nome: z.string().describe('Como o material foi chamado no áudio'),
  quantidade: numeroOpcional('null se não foi dito'),
  unidade: textoOpcional('m3, saco, barra, un, kg'),
});

export const MaoDeObraSchema = z.object({
  funcao: z.string().describe('pedreiro, servente, armador, carpinteiro...'),
  quantidade: z.number().int().min(1),
  nomes: z.array(z.string()).default([]).describe('Nomes citados, se houver'),
});

export const AtividadeSchema = z.object({
  etapa: z.string().describe('Nome técnico da etapa executada'),
  local: textoOpcional('Bloco, pavimento, frente de serviço'),
  descricao: textoOpcional(),
  quantidade: numeroOpcional(),
  unidade: textoOpcional(),
});

export const OcorrenciaSchema = z.object({
  tipo: z.enum(['problema', 'atraso', 'seguranca', 'nao_conformidade', 'acidente', 'incidente']),
  gravidade: z.enum(['baixa', 'media', 'alta', 'critica']).default('baixa'),
  descricao: z.string(),
  epi_citado: z.array(z.string()).default([]),
});

/** Campos que a IA pode marcar como pendentes e perguntar. */
export const CAMPOS_PERGUNTAVEIS = [
  'obra',
  'etapa',
  'local',
  'quantidade_material',
  'efetivo',
  'horas_trabalhadas',
  'ocorrencias',
] as const;

export const ExtracaoRDOSchema = z.object({
  obra_mencionada: textoOpcional('Nome ou apelido da obra como foi dito. null se não mencionada.'),
  data: textoOpcional('AAAA-MM-DD. Use a data de referência informada se o áudio disser "hoje".'),
  clima: textoOpcional(),
  atividades: z.array(AtividadeSchema).default([]),
  materiais: z.array(MaterialSchema).default([]),
  equipamentos: z.array(z.string()).default([]),
  mao_de_obra: z.array(MaoDeObraSchema).default([]),
  horas_trabalhadas: numeroOpcional(),
  ocorrencias: z.array(OcorrenciaSchema).default([]),
  proximas_atividades: z.array(z.string()).default([]),
  observacoes: textoOpcional(),

  /**
   * Campos importantes que o usuário NÃO informou. Cada item vira uma pergunta.
   * Preencher isto é obrigatório — é o que impede o sistema de fechar um RDO
   * pela metade fingindo que está completo.
   */
  campos_pendentes: z
    .array(
      z.object({
        campo: z.string(),
        pergunta: z.string().describe('Pergunta curta e direta, em português do canteiro'),
      }),
    )
    .default([]),

  /** Confiança da própria extração (0 a 1). Abaixo de 0.5 pedimos confirmação. */
  confianca: z.number().min(0).max(1).default(0.8),
});

export type ExtracaoRDO = z.infer<typeof ExtracaoRDOSchema>;

/**
 * Mesmo schema em JSON Schema, para o function calling do provedor.
 * Mantido à mão (e não gerado) porque os provedores aceitam um subconjunto
 * restrito de JSON Schema, e a conversão automática costuma emitir construções
 * que a API rejeita.
 */
export const FUNCTION_EXTRAIR_RDO = {
  name: 'registrar_rdo',
  description:
    'Registra as informações do dia de trabalho na obra extraídas do relato do usuário.',
  parameters: {
    type: 'object',
    properties: {
      obra_mencionada: { type: ['string', 'null'] },
      data: { type: ['string', 'null'], description: 'AAAA-MM-DD' },
      clima: { type: ['string', 'null'] },
      atividades: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            etapa: { type: 'string' },
            local: { type: ['string', 'null'] },
            descricao: { type: ['string', 'null'] },
            quantidade: { type: ['number', 'null'] },
            unidade: { type: ['string', 'null'] },
          },
          required: ['etapa'],
        },
      },
      materiais: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            nome: { type: 'string' },
            quantidade: { type: ['number', 'null'] },
            unidade: { type: ['string', 'null'] },
          },
          required: ['nome'],
        },
      },
      equipamentos: { type: 'array', items: { type: 'string' } },
      mao_de_obra: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            funcao: { type: 'string' },
            quantidade: { type: 'integer' },
            nomes: { type: 'array', items: { type: 'string' } },
          },
          required: ['funcao', 'quantidade'],
        },
      },
      horas_trabalhadas: { type: ['number', 'null'] },
      ocorrencias: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            tipo: {
              type: 'string',
              enum: ['problema', 'atraso', 'seguranca', 'nao_conformidade', 'acidente', 'incidente'],
            },
            gravidade: { type: 'string', enum: ['baixa', 'media', 'alta', 'critica'] },
            descricao: { type: 'string' },
            epi_citado: { type: 'array', items: { type: 'string' } },
          },
          required: ['tipo', 'descricao'],
        },
      },
      proximas_atividades: { type: 'array', items: { type: 'string' } },
      observacoes: { type: ['string', 'null'] },
      campos_pendentes: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            campo: { type: 'string' },
            pergunta: { type: 'string' },
          },
          required: ['campo', 'pergunta'],
        },
      },
      confianca: { type: 'number' },
    },
    required: ['atividades', 'materiais', 'campos_pendentes', 'confianca'],
  },
} as const;

/**
 * Instrução do sistema.
 *
 * Escrita para o contexto real: o áudio vem de alguém falando no meio do
 * canteiro, com betoneira ligada, usando o vocabulário da obra. O modelo
 * precisa entender "deu uns 12 metros de concreto" sem transformar isso em
 * texto corporativo — e, principalmente, sem preencher o que não ouviu.
 */
export const PROMPT_EXTRACAO = `Você é o assistente técnico da ObraIA, especialista em Relatório Diário de Obra (RDO) da construção civil brasileira.

Você recebe o relato de um profissional de obra (mestre, encarregado ou engenheiro), normalmente transcrito de um áudio gravado no canteiro. O relato é informal, pode ter gíria regional, frases incompletas e erros de transcrição por causa do ruído.

SUA TAREFA
Extrair as informações do dia de trabalho e chamar a função registrar_rdo.

REGRAS INEGOCIÁVEIS
1. NUNCA invente, estime ou complete dado que não foi dito. Se o volume de concreto não foi mencionado, o campo é null — jamais um valor "provável". O RDO é documento técnico e pode ter valor jurídico.
2. Tudo que faltar e for importante vai em campos_pendentes, com uma pergunta curta e direta.
3. Interprete o vocabulário do canteiro:
   - "metro" de concreto = metro cúbico (m3)
   - "ferro", "vergalhão", "aço" = vergalhão CA-50
   - "massa", "argamassa" = argamassa
   - "laje", "baldrame", "radier", "sapata" = elementos estruturais
   - "bloco B", "torre 2", "frente 3" = local da atividade
4. Corrija erros óbvios de transcrição pelo contexto ("concretagem" ouvido como "concretagem" ou "concreta gem").
5. Se o relato mencionar acidente, quase-acidente, falta de EPI ou risco, registre em ocorrencias com o tipo e a gravidade corretos. Segurança nunca é omitida.
6. Escreva as descrições em português técnico e profissional, mas fiel ao que foi dito. Não acrescente conclusões.
7. Se o relato não tiver NENHUMA informação de obra (ex.: "bom dia", "obrigado"), devolva tudo vazio e confianca baixa.

PERGUNTAS
Faça no máximo 3 perguntas por vez, priorizando o que impede o fechamento do RDO:
- qual obra (quando ambíguo)
- qual local/bloco da atividade
- quantidade de material consumido
- efetivo (quantas pessoas)
- se houve ocorrência

As perguntas devem soar como um colega de obra perguntando, não como um formulário. Exemplo bom: "Qual bloco foi concretado?" Exemplo ruim: "Favor informar o campo LOCAL da atividade."`;
