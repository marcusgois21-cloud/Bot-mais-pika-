import { validar, type Texto } from '@/lib/conteudo'

/**
 * Copy de /contato/ (spec §14.7, §18.1, §19). O texto vai ao ar exatamente como está aqui.
 *
 * `validar('…')` marca um compromisso que a Gois Group precisa confirmar que pratica (spec §22.2, item 7):
 * aparece normalmente; em homologação ganha um sublinhado pontilhado; o build de produção falha enquanto
 * houver `aprovado: false`. Para aprovar: `validar('…', true)`.
 *
 * As frases que a spec não escreve (erros de campo vazio, rótulo do resumo, faixa de homologação) seguem as
 * regras de voz de §3: curtas, com verbo, sem adjetivo.
 */

export type TipoProjeto = 'site-novo' | 'site-existente' | 'plataforma-sistema' | 'parceria' | 'outro'

export interface OpcaoTipo {
  readonly valor: TipoProjeto
  readonly titulo: string
  readonly apoio: string
}

const PRAZOS = ['Sem data definida', 'Até 3 meses', 'De 3 a 6 meses', 'Mais de 6 meses'] as const

/** Página (servidor): topo, lateral, metadados, faixa de homologação. */
export const contatoPagina = {
  meta: {
    title: 'Iniciar um projeto',
    description:
      'Conte o que precisa entrar no ar: um site novo, a reconstrução de um site existente, uma plataforma, um sistema ou uma parceria.',
  },
  trilha: 'Contato',

  h1: 'Conte o que precisa entrar no ar.',
  lead: 'Poucas perguntas, todas úteis. Quanto mais claro o ponto de partida, mais precisa a primeira resposta.',

  /* ── lateral ─────────────────────────────────────────────────────────────── */
  depois: {
    titulo: 'O que acontece depois',
    passos: [
      validar('Lemos com atenção.'),
      validar('Respondemos pelo e-mail informado, com perguntas ou com uma primeira leitura do caso.'),
      validar('Se fizer sentido para os dois lados, marcamos uma conversa.'),
    ] as readonly Texto[],
    /** exibido só quando o prazo for informado em content/site.ts */
    prazo: 'Prazo de resposta',
  },
  canais: { titulo: 'Canais' },

  /* ── faixa de homologação: nenhum canal configurado ──────────────────────── */
  semCanal: 'Canal de envio pendente. O formulário ainda não tem endpoint nem e-mail configurado.',
} as const

/** Formulário (cliente): só o que o componente usa, para não levar a copy da página ao bundle. */
export const contato = {
  /* ── formulário ──────────────────────────────────────────────────────────── */
  obrigatorio: 'obrigatório',

  tipo: {
    legenda: 'O que você quer construir?',
    opcoes: [
      {
        valor: 'site-novo',
        titulo: 'Um site novo',
        apoio: 'Para uma empresa que está nascendo ou que nunca teve o site certo.',
      },
      {
        valor: 'site-existente',
        titulo: 'Um site que já existe',
        apoio: 'Para refazer ou evoluir o que não acompanha mais a empresa.',
      },
      {
        valor: 'plataforma-sistema',
        titulo: 'Uma plataforma ou um sistema',
        apoio: 'Quando o site precisa operar, não só apresentar.',
      },
      {
        valor: 'parceria',
        titulo: 'Uma parceria',
        apoio: 'Estúdios, equipes e empresas que querem construir junto.',
      },
      {
        valor: 'outro',
        titulo: 'Outro assunto',
        apoio: 'Imprensa, fornecedores e demais contatos.',
      },
    ] as readonly OpcaoTipo[],
  },

  sobreVoce: {
    legenda: 'Sobre você',
    nome: { rotulo: 'Nome', ajuda: 'Como devemos chamar você?' },
    email: { rotulo: 'E-mail' },
    empresa: { rotulo: 'Empresa' },
    cargo: { rotulo: 'Cargo' },
    telefone: { rotulo: 'Telefone ou WhatsApp' },
  },

  projeto: {
    legenda: 'Sobre o projeto',
    prazo: { rotulo: 'Prazo desejado', opcoes: PRAZOS },
    siteNovo: {
      momento: {
        rotulo: 'Em que momento a empresa está?',
        opcoes: ['Ainda é uma ideia', 'Já opera, sem site', 'Já opera, com um site que não a representa'],
      },
      objetivo: { rotulo: 'O que esse site precisa fazer pela empresa?' },
    },
    siteExistente: {
      endereco: { rotulo: 'Endereço do site atual' },
      problemas: {
        rotulo: 'O que não está funcionando?',
        opcoes: [
          'Está lento',
          'É difícil de editar',
          'Não aparece bem no Google',
          'Não converte',
          'O visual não representa mais a empresa',
          'Integrações falham',
          'Outro',
        ],
      },
      mudancas: { rotulo: 'O que mudou na empresa desde que o site foi feito?' },
    },
    plataforma: {
      necessidades: {
        rotulo: 'O que precisa existir?',
        opcoes: [
          'Área do cliente',
          'Portal ou painel',
          validar('Loja virtual'),
          'Sistema interno',
          'Integração entre sistemas',
          'Produto digital',
          'Ainda não sei',
        ] as readonly Texto[],
      },
      sistemas: { rotulo: 'Quais sistemas precisam conversar?' },
      usuarios: { rotulo: 'Quem vai usar, e para fazer o quê?' },
    },
    parceria: {
      tipoParceria: {
        rotulo: 'Tipo de parceria',
        opcoes: ['Estúdio ou agência', 'Tecnologia', 'Empresa ou investimento', 'Outro'],
      },
      site: { rotulo: 'Site' },
      construirJunto: { rotulo: 'Como você imagina construir junto?' },
    },
    outro: {
      assunto: { rotulo: 'Assunto' },
      mensagem: { rotulo: 'Mensagem' },
    },
    exemploUrl: 'https://suaempresa.com.br',
  },

  /** [VALIDAR: jurídico] — spec §14.7 */
  privacidade: {
    texto: validar('Usamos estes dados só para responder a este contato.'),
    antesDoLink: 'Veja a',
    link: 'Política de privacidade',
    href: '/privacidade/',
  },

  /* ── erros (spec §14.7; os de campo vazio completam a lista na mesma voz) ── */
  erros: {
    nome: 'Como devemos chamar você?',
    emailVazio: 'Precisamos de um e-mail para responder.',
    email: 'Esse e-mail parece incompleto. Confira o que vem depois do @.',
    empresa: 'Qual é o nome da empresa?',
    assunto: 'Em poucas palavras, qual é o assunto?',
    mensagem: 'Conte um pouco mais. Uma ou duas frases já ajudam.',
    urlVazia: 'Informe o endereço. Exemplo: https://suaempresa.com.br',
    url: 'Parece incompleto. Exemplo: https://suaempresa.com.br',
    tipo: 'Escolha o que você quer construir.',
    radio: 'Escolha uma opção.',
    /** "Faltam três ajustes antes de enviar:" — número por extenso (até dez) */
    resumo: (n: number, porExtenso: string) =>
      n === 1 ? 'Falta um ajuste antes de enviar:' : `Faltam ${porExtenso} ajustes antes de enviar:`,
  },

  /* ── envio ───────────────────────────────────────────────────────────────── */
  envio: {
    enviar: 'Enviar',
    enviando: 'Enviando…',
    porEmail: 'Enviar pelo seu e-mail',
    porEmailNota: 'Vamos abrir o seu aplicativo de e-mail com a mensagem pronta.',
  },
  sucesso: {
    titulo: 'Recebido.',
    texto: 'Sua mensagem foi registrada. A resposta vem da equipe da Gois Group, pelo e-mail informado.',
    resumo: 'O que foi enviado',
    voltar: 'Voltar ao início',
  },
  falha: {
    titulo: 'Não foi possível enviar agora.',
    texto: 'Nada do que você escreveu se perdeu.',
    tentar: 'Tentar de novo',
    email: 'Enviar por e-mail',
    copiar: 'Copiar mensagem',
    copiado: 'Copiado',
    copiadoAnuncio: 'Mensagem copiada.',
  },

  /* ── mensagem montada (mailto e "Copiar mensagem"), spec §14.7 · Técnica ─── */
  mensagem: {
    /** `[Gois Group] {Tipo} — {Empresa ou Nome}` */
    assunto: (tipo: string, quem: string) => `[Gois Group] ${tipo} — ${quem}`,
    origem: 'Origem',
    semOrigem: 'não informada',
  },

  /** campo-armadilha para robôs (fora da tela, fora do foco) */
  armadilha: 'Website',
} as const
