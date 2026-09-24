import { validar, type Escopo, type Texto } from '@/lib/conteudo'

/**
 * Copy final das seções narrativas da Home (spec §8): 01 Quem é, 02 O que construímos, 06 Visão e
 * 08 Próximo passo. O texto vai ao ar exatamente como está aqui.
 *
 * `validar('…')` marca um compromisso ou uma oferta que a Gois Group precisa confirmar que pratica
 * (spec §0, §22.2). Aparece normalmente no site; em homologação ganha um sublinhado pontilhado; o build
 * de produção falha enquanto houver `aprovado: false`. Para aprovar: `validar('…', true)`.
 *
 * Setas nunca entram na copy: todo link recebe a seta em SVG no componente.
 */

type Link = { readonly texto: string; readonly href: string }

// ── 01 · Quem é ─────────────────────────────────────────────────────────────

export const quemE = {
  rotulo: 'Quem é',
  titulo: 'Desenvolvemos sites. E tudo o que precisa existir por baixo deles.',
  lead:
    'A Gois Group é uma empresa de desenvolvimento de sites e estrutura digital. Projetamos, construímos e operamos sites, plataformas e sistemas web para empresas que precisam que a presença digital funcione como parte do negócio — não como enfeite dele.',
  corpo:
    'Estratégia, design e engenharia trabalham no mesmo projeto, sob o mesmo método e medidos pelo mesmo critério: o que sustenta a empresa fica; o resto sai.',
  afirmacoes: [
    {
      termo: 'O que aparece.',
      texto: 'Identidade, interface e conteúdo. É por onde a empresa é julgada nos primeiros segundos.',
    },
    {
      termo: 'O que sustenta.',
      texto:
        'Arquitetura de informação, código, dados, integrações e velocidade. É o que decide se a primeira impressão se confirma.',
    },
    {
      termo: 'O que ele precisa fazer.',
      texto: 'Ser encontrado, explicar, vender, atender, operar. Tudo o que construímos é medido por isso.',
    },
  ],
  link: { texto: 'Sobre a Gois Group', href: '/sobre/' } satisfies Link,
} as const

// ── 02 · O que construímos ──────────────────────────────────────────────────

export interface Estrutura {
  readonly id: Escopo
  /** Uma oferta ainda não confirmada tem o nome em `validar()`: sem aprovação, não entra em produção. */
  readonly nome: Texto
  readonly paraQue: string
  readonly inclui: readonly Texto[]
  /** Critério de pronto, em minúscula: continua a frase do rótulo "Pronto quando". */
  readonly prontoQuando: Texto
  readonly link: Link
}

const origem02 = 'origem=home-02'

export const oQueConstruimos = {
  rotulo: 'O que construímos',
  /**
   * O número do título é derivado da quantidade de linhas aprovadas e escrito por extenso (lib/formatar):
   * se "Reconstrução" não for validada, o título passa a dizer "Quatro".
   */
  titulo: (numeroPorExtenso: string, quantidade: number) =>
    `${numeroPorExtenso} ${quantidade === 1 ? 'tipo' : 'tipos'} de estrutura. Uma engenharia.`,
  lead:
    'Tudo o que a Gois Group constrói roda na web — do site institucional ao sistema que a operação usa todos os dias. Muda o tamanho da estrutura. O método é o mesmo.',
  rotuloParaQue: 'Para quê',
  rotuloInclui: 'Inclui',
  rotuloProntoQuando: 'Pronto quando',
  estruturas: [
    {
      id: 'site',
      nome: 'Sites',
      paraQue: 'Onde a empresa é encontrada, entendida e escolhida.',
      inclui: [
        'Arquitetura de páginas',
        'design de interface',
        'conteúdo',
        'SEO técnico',
        'gerenciador de conteúdo',
        'medição',
      ],
      prontoQuando: validar('quem chega entende o que a empresa faz e sabe qual é o próximo passo.'),
      link: { texto: 'Começar por um site', href: `/contato/?tipo=site-novo&${origem02}` },
    },
    {
      id: 'plataforma',
      nome: 'Plataformas web',
      paraQue: 'Onde o cliente entra, usa e volta.',
      inclui: [
        'Áreas logadas',
        'portais',
        validar('catálogos e lojas virtuais'),
        'agendamentos',
        'pagamentos',
        'painéis do cliente',
      ],
      prontoQuando: validar('as tarefas principais são concluídas sem ajuda.'),
      link: { texto: 'Começar por uma plataforma', href: `/contato/?tipo=plataforma-sistema&${origem02}` },
    },
    {
      id: 'sistema',
      nome: 'Sistemas internos',
      paraQue: 'Onde a operação acontece sem planilha paralela.',
      inclui: [
        'Painéis de gestão',
        'fluxos de aprovação',
        'integrações com ERP e CRM',
        'automações',
        'permissões',
        'relatórios',
      ],
      prontoQuando: validar('a equipe para de depender de planilhas paralelas.'),
      link: { texto: 'Começar por um sistema', href: `/contato/?tipo=plataforma-sistema&${origem02}` },
    },
    {
      id: 'produto',
      nome: 'Produtos digitais',
      paraQue: 'Do primeiro esboço ao primeiro usuário — e aos seguintes.',
      inclui: ['Descoberta', 'protótipo', 'primeira versão', 'lançamento', 'evolução orientada por dados'],
      prontoQuando: validar(
        'a primeira versão está nas mãos de usuários reais, medindo o que foi definido na Leitura.',
      ),
      link: { texto: 'Começar por um produto', href: `/contato/?tipo=plataforma-sistema&${origem02}` },
    },
    {
      id: 'reconstrucao',
      nome: validar('Reconstrução de sites existentes'),
      paraQue: 'Para quando o site atual já não acompanha o que a empresa se tornou.',
      inclui: ['Auditoria', 'plano de migração', 'redirecionamentos', 'reconstrução por etapas', 'monitoramento'],
      prontoQuando: validar(
        'a nova versão supera a antiga em todas as medições da linha de base, sem ter saído do ar.',
      ),
      link: { texto: 'Começar pela auditoria', href: `/contato/?tipo=site-existente&${origem02}` },
    },
  ] satisfies readonly Estrutura[],
  fecho: 'Não sabe qual combinação precisa? É exatamente por aí que o método começa.',
  fechoLink: { texto: 'Ver o Método Prumo', href: '#metodo' } satisfies Link,
} as const

// ── 06 · Visão (a única seção em papel) ─────────────────────────────────────

export const visao = {
  rotulo: 'Visão',
  titulo: 'Um site não deveria ser refeito a cada mudança da empresa.',
  paragrafos: [
    'O site é onde a empresa é encontrada, avaliada e contratada — e, cada vez mais, onde ela trabalha. Mesmo assim, quase sempre é tratado como peça de campanha: feito para o lançamento e refeito do zero alguns anos depois.',
    'A visão da Gois Group é a oposta: estrutura digital projetada para receber o que a empresa ainda vai precisar. Cada página, cada integração e cada dado medido servindo à próxima decisão — em vez de ir para o lixo no próximo redesenho.',
  ],
  fecho: 'Construímos para acumular.',
} as const

// ── 08 · Próximo passo ──────────────────────────────────────────────────────

export interface Entrada {
  readonly titulo: string
  readonly apoio: string
  readonly href: string
}

export const proximoPasso = {
  rotulo: 'Próximo passo',
  titulo: 'O que precisa entrar no ar?',
  corpo: validar(
    'Conte o que você quer construir. A primeira conversa já faz parte da Leitura — serve para entender o negócio, não para vender um pacote.',
  ),
  entradas: [
    {
      titulo: 'Um site novo',
      apoio: 'Para uma empresa que está nascendo ou que nunca teve o site certo.',
      href: '/contato/?tipo=site-novo&origem=home-08',
    },
    {
      titulo: 'Um site que já existe',
      apoio: 'Para refazer ou evoluir o que não acompanha mais a empresa.',
      href: '/contato/?tipo=site-existente&origem=home-08',
    },
    {
      titulo: 'Uma plataforma ou um sistema',
      apoio: 'Quando o site precisa operar, não só apresentar.',
      href: '/contato/?tipo=plataforma-sistema&origem=home-08',
    },
    {
      titulo: 'Uma parceria',
      apoio: 'Estúdios, equipes e empresas que querem construir junto.',
      href: '/contato/?tipo=parceria&origem=home-08',
    },
  ] satisfies readonly Entrada[],
  botao: { texto: 'Iniciar um projeto', href: '/contato/?origem=home-08' } satisfies Link,
} as const
