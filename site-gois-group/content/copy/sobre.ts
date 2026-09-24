import { validar, type Texto } from '@/lib/conteudo'

/**
 * Copy institucional: /sobre/ (spec §3 manifesto, §14.6, §18.1) e a página 404 (spec §14.9).
 * Texto final: vai ao ar exatamente como está escrito aqui.
 *
 * `validar('…')` marca compromisso ou oferta que a Gois Group precisa confirmar que pratica (spec §0,
 * §22.2, item 5: "continuar responsável depois do lançamento" e o Modelo). Aparece normalmente; em
 * homologação ganha sublinhado pontilhado; o build de produção falha enquanto houver `aprovado: false`.
 *
 * Dados factuais (fundação, fundadores, marcos) NÃO ficam aqui: vêm de `content/site.ts`, como
 * `pending('[…]')` até a Gois Group informar. Setas nunca entram na copy: são SVG no componente.
 */

type Link = { readonly texto: string; readonly href: string }

export type FormaDeTrabalho = {
  readonly id: 'construcao' | 'evolucao' | 'parceria'
  readonly nome: string
  readonly texto: Texto
  /** Trecho do trilho do Método coberto por esta forma (fases 1–6, inclusivas). */
  readonly de: number
  readonly ate: number
  /** P6 em laço: cada ciclo volta ao começo da própria fase. */
  readonly laco?: true
  /** Segunda linha técnica, visível (mono). */
  readonly codigos: string
  /** O mesmo trecho, por extenso, para leitor de tela. */
  readonly leitura: string
}

export const sobre = {
  meta: {
    title: 'Sobre',
    description:
      'Por que a Gois Group existe, no que acredita e como trabalha: sites construídos de dentro para fora, com método, engenharia e medição.',
  },

  rotulo: 'Sobre',
  h1: 'Existimos porque quase todo site é construído de fora para dentro.',
  lead:
    'Primeiro a aparência, depois o conteúdo, por último a engenharia. A empresa descobre os limites do próprio site justo quando mais precisa dele. A Gois Group trabalha na ordem inversa.',

  /** Spec §3: um verso por linha, revelados por corte com 80 ms entre eles. */
  manifesto: {
    rotulo: 'Manifesto',
    versos: [
      'Todo site tem duas camadas.',
      'A que o cliente vê — e a que decide se ela funciona.',
      'Nós construímos as duas, com o mesmo rigor, no mesmo projeto.',
      'Estratégia, desenho e código, medidos pelo mesmo critério:',
      'o que sustenta o negócio fica. O resto sai.',
      'Por isso qualquer página deste site pode ser vista por dentro.',
    ],
  },

  /** 01. A continuidade depois do lançamento é compromisso a validar (spec §22.2, item 5). */
  porQue: {
    rotulo: 'Por que existimos',
    texto: [
      'Um site é a parte da empresa que trabalha o tempo todo: atende quem chega, explica o que ela faz, vende enquanto a equipe dorme, conecta sistemas que ninguém vê. Quando essa parte é tratada como detalhe, a empresa paga duas vezes — na oportunidade perdida e na reconstrução. A Gois Group existe para projetar essa parte com o rigor que ela exige, desde o início, ',
      validar('e para continuar responsável por ela depois do lançamento.'),
    ] as readonly Texto[],
  },

  /** 02 */
  visao: {
    rotulo: 'Visão',
    texto:
      'Estrutura digital tratada como infraestrutura: projetada para durar, medida desde o primeiro dia, mantida por quem a construiu e ampliada quando a empresa cresce.',
  },

  /** 03. Convicções declaradas como convicções (spec §3, regras de voz). */
  conviccoes: {
    rotulo: 'Convicções',
    itens: [
      {
        afirmacao: 'O site é a empresa, na web.',
        explicacao:
          'Para muita gente é o primeiro contato — às vezes, o único. Merece o rigor de um produto, não o prazo de uma peça.',
      },
      {
        afirmacao: 'Estrutura não aparece — até faltar.',
        explicacao: 'Ninguém elogia um site rápido, acessível e bem indexado. Todo mundo sente quando ele não é.',
      },
      {
        afirmacao: 'Beleza sem medida é opinião.',
        explicacao: 'Design é julgado pelo que faz acontecer. Por isso a métrica vem antes do layout.',
      },
      {
        afirmacao: 'Velocidade é respeito.',
        explicacao: 'Cada segundo de carregamento é tempo tirado de quem chegou até você.',
      },
      {
        afirmacao: 'Método vence talento isolado.',
        explicacao: 'Talento faz um bom projeto. Método faz o próximo também.',
      },
      {
        afirmacao: 'Mostrar vale mais que afirmar.',
        explicacao: 'Por isso este site pode ser visto por dentro, medido e conferido por quem quiser.',
      },
    ],
  },

  /** 04. O Modelo inteiro é oferta a validar (spec §14.6, §22.2, item 5). */
  modelo: {
    rotulo: 'Modelo',
    intro: validar('Trabalhamos de três formas.'),
    formas: [
      {
        id: 'construcao',
        nome: 'Construção.',
        texto: validar('Um projeto com escopo e seis fases, da Leitura ao Lançamento. Termina com o site no ar e medido.'),
        de: 1,
        ate: 5,
        codigos: 'P1–P5',
        leitura: 'Cobre as fases P1 a P5, da Leitura ao Lançamento.',
      },
      {
        id: 'evolucao',
        nome: 'Evolução contínua.',
        texto: validar('Ciclos depois do lançamento: medir, decidir, mudar, medir de novo.'),
        de: 6,
        ate: 6,
        laco: true,
        codigos: 'P6 em laço',
        leitura: 'Cobre a fase P6, em laço: cada ciclo recomeça a própria fase.',
      },
      {
        id: 'parceria',
        nome: 'Parceria.',
        texto: validar('Construção conjunta com estúdios, equipes e empresas que precisam de um time técnico ao lado.'),
        de: 1,
        ate: 6,
        codigos: 'P1–P6',
        leitura: 'Cobre as fases P1 a P6, da Leitura à Evolução.',
      },
    ] satisfies readonly FormaDeTrabalho[],
  },

  /** 05 */
  comoPensamos: {
    rotulo: 'Como pensamos',
    texto:
      'O Método Prumo organiza tudo o que fazemos em seis fases, cada uma com artefatos e um critério de passagem: Leitura, Arquitetura, Desenho, Construção, Lançamento, Evolução.',
    link: { texto: 'Ver o método', href: '/#metodo' } satisfies Link,
  },

  /**
   * 06. Só é renderizado com pelo menos um marco real (spec §14.6, §22.1). Os valores vêm de
   * `site.fundacao`, `site.fundadores` e `site.marcos`; em homologação aparecem as três instruções.
   */
  registro: {
    rotulo: 'Registro',
    legenda: 'Registro da Gois Group: ano e marco.',
    colunas: { ano: 'Ano', marco: 'Marco' },
    fundacao: 'Fundação',
    /** "Fundação, por Ana e Bruno" — só com os nomes informados. */
    por: 'por',
  },

  /** 07 */
  oQueVem: {
    rotulo: 'O que vem',
    texto:
      'Cada site que construímos ensina alguma coisa ao próximo. O plano é simples de dizer e difícil de cumprir: construir menos coisas descartáveis e mais coisas que aguentam o tempo e o crescimento de quem depende delas.',
  },

  fecho: {
    texto: 'Se a sua empresa precisa de um site que aguente o que ela ainda vai virar, o começo é uma conversa.',
    cta: { texto: 'Iniciar um projeto', href: '/contato/?origem=sobre' } satisfies Link,
  },
} as const

/** Página 404 (spec §14.9, §18.1). */
export const naoEncontrada = {
  meta: { title: 'Página não encontrada' },
  h1: 'Esta página não foi construída.',
  texto: 'O endereço pode ter mudado — ou nunca ter existido. Tudo o que construímos começa por aqui:',
  /** Nome acessível da lista de caminhos. */
  caminhos: 'Caminhos a partir daqui',
  links: [
    { texto: 'Início', href: '/' },
    { texto: 'Empresas', href: '/empresas/' },
    { texto: 'Cases', href: '/cases/' },
    { texto: 'Iniciar um projeto', href: '/contato/?origem=404' },
  ] satisfies readonly Link[],
  anotacao: { principal: 'Nesta página: nenhum elemento para medir.', tecnica: '404' },
} as const
