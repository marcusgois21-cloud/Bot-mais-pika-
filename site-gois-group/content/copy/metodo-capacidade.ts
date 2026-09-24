import { validar, type Texto } from '@/lib/conteudo'

/**
 * Copy final das seções 03 · Como construímos (Método Prumo) e 05 · Capacidade da Home
 * (spec §8-03, §8-05, §10, §11.2, §13). Os dados das fases, das disciplinas e dos números ficam em
 * content/metodo.ts, content/capacidades.ts e content/numeros.ts; aqui fica só o texto das seções.
 * O travessão vem preso à palavra anterior por U+00A0 (nunca abre linha); o texto é o da spec.
 */

/** `?origem=` de cada CTA destas seções (vai num campo oculto do formulário, spec §14.7). */
export const ORIGEM = { metodo: 'home-03', capacidade: 'home-05' } as const

const contato = (origem: string) => `/contato/?origem=${origem}`

export type CopyMetodo = {
  rotulo: string
  titulo: string
  /** etiqueta mono ao lado do título; a versão vem de content/metodo.ts */
  etiqueta: (versao: number) => string
  lead: string
  /** desktop: rótulo do laço de retorno desenhado sobre o trilho */
  rotuloLaco: string
  /** mobile e sem JS: o laço vira esta nota */
  notaLaco: string
  painel: { acontece: string; artefatos: string; passaQuando: string }
  fecho: string
  cta: { rotulo: string; href: string }
}

export const copyMetodo: CopyMetodo = {
  rotulo: 'Como construímos',
  titulo: 'Método Prumo.',
  etiqueta: versao => `Versão ${versao}`,
  lead: 'Prumo é o instrumento que garante que uma parede sobe reta. Em português, ter prumo também é ter juízo. O método tem os dois sentidos: precisão para construir, critério para decidir. São seis fases\u00A0— e nenhuma começa antes de a anterior cumprir o seu critério.',
  rotuloLaco: 'Cada ciclo de evolução volta à Leitura\u00A0— agora com dados reais.',
  notaLaco: 'P6 volta para P1: cada ciclo recomeça pela Leitura, com dados reais.',
  painel: { acontece: 'O que acontece', artefatos: 'Artefatos', passaQuando: 'Passa quando' },
  fecho: 'A primeira conversa já faz parte da Leitura.',
  cta: { rotulo: 'Iniciar um projeto', href: contato(ORIGEM.metodo) },
}

export type CopyCapacidade = {
  rotulo: string
  titulo: string
  lead: string
  fecho: string
  /** o botão real desta seção: o mesmo componente do hero, funcional */
  botao: { rotulo: string; href: string; origem: string }
  /** anotações do espécime (em mono): o estado atual do botão e a origem que ele carrega */
  especime: { estado: string; repouso: string; foco: string; origem: string }
  /** representação da faixa Estratégia: a frase-promessa, em --fs-body */
  promessa: Texto
  /** representação da faixa Design: rótulos das medidas do botão desenhado */
  medidas: { altura: string; contraste: string }
  /** representação da faixa Engenharia: estados, em mono */
  estados: string[]
  /** representação da faixa Operação: campos do envio, em mono */
  campos: string[]
  /** rótulos acessíveis das listas em mono */
  rotuloEstados: string
  rotuloCampos: string
  rotuloCapacidades: string
  numeros: { titulo: string; lead: string }
}

export const copyCapacidade: CopyCapacidade = {
  rotulo: 'Capacidade',
  titulo: 'Um botão atravessa quatro disciplinas.',
  lead: 'Capacidade não é uma lista de serviços. É o número de decisões certas que cabem num único elemento. Pegue o botão “Iniciar um projeto”\u00A0— o mesmo do topo desta página\u00A0— e veja quem decide o quê.',
  fecho:
    'Na Gois Group, as quatro decisões são tomadas no mesmo projeto, sob o mesmo método. É isso que chamamos de capacidade.',
  botao: { rotulo: 'Iniciar um projeto', href: contato(ORIGEM.capacidade), origem: ORIGEM.capacidade },
  especime: { estado: 'Estado', repouso: 'Repouso', foco: 'Foco', origem: 'Origem' },
  // a promessa do botão é compromisso da Gois Group (spec §22.2, item 4)
  promessa: validar('“Uma leitura do seu caso, não um orçamento genérico.”'),
  medidas: { altura: 'Altura', contraste: 'Contraste' },
  estados: ['Repouso', 'Foco', 'Enviando', 'Enviado', 'Falhou'],
  campos: ['Tipo', 'Origem', 'Página', 'Data'],
  rotuloEstados: 'Estados do envio',
  rotuloCampos: 'Campos que chegam com cada mensagem',
  rotuloCapacidades: 'Capacidades',
  numeros: {
    titulo: 'Números com fonte, ou nenhum número.',
    lead: 'Cada número publicado aqui tem definição, fonte e data. Enquanto não tiver, o campo fica aberto\u00A0— à vista.',
  },
}
