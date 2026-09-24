import { validar, ESCOPO_ROTULO, type Escopo, type Relacao, type Status, type Texto } from '@/lib/conteudo'

/**
 * Copy do ecossistema — Home 04, /empresas/ e /empresas/[slug]/ (spec §8-04, §9, §14.1, §14.2, §18.1).
 * Texto final: vai ao ar exatamente como está escrito. Nenhuma frase sugere que existem empresas a caminho.
 */

/* ── contagens (até dez, por extenso; feminino: "uma", "duas") ─────────────── */
const FEMININO = ['nenhuma', 'uma', 'duas', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez']
function quantas(n: number): string {
  const s = n >= 0 && n <= 10 ? FEMININO[n] : new Intl.NumberFormat('pt-BR').format(n)
  return s.charAt(0).toUpperCase() + s.slice(1)
}
/** Resumo oculto para leitor de tela (spec §9.3). */
export function resumoPublicadas(n: number): string {
  if (n === 0) return 'Nenhuma empresa publicada.'
  return `${quantas(n)} ${n === 1 ? 'empresa publicada' : 'empresas publicadas'}.`
}
/** Contagem dos filtros, em aria-live (spec §14.1). */
export function contagemExibidas(n: number): string {
  if (n === 0) return 'Nenhuma empresa exibida'
  return `${quantas(n)} ${n === 1 ? 'empresa exibida' : 'empresas exibidas'}`
}

/* ── rótulos de domínio ───────────────────────────────────────────────────── */
/** "Empresa do grupo" como categoria do ecossistema é compromisso a validar (spec §22.2, item 6). */
export const RELACAO: Record<Relacao, Texto> = {
  'estrutura-construida': 'Estrutura construída',
  'estrutura-operada': 'Estrutura operada',
  'empresa-do-grupo': validar('Empresa do grupo'),
  parceira: 'Parceira',
}
export const STATUS_ORDEM: Status[] = ['em-operacao', 'em-construcao', 'em-evolucao']
export const RELACAO_ORDEM: Relacao[] = ['estrutura-construida', 'estrutura-operada', 'empresa-do-grupo', 'parceira']

/** "site, plataforma e sistema interno" — para o nome acessível do link do nó. */
export function escopoEmFrase(itens: Escopo[]): string {
  const r = itens.map(i => ESCOPO_ROTULO[i].toLowerCase())
  return r.length <= 1 ? (r[0] ?? '') : `${r.slice(0, -1).join(', ')} e ${r[r.length - 1]}`
}

/* ── Home 04 ──────────────────────────────────────────────────────────────── */
export const ecossistemaHome = {
  rotulo: 'Ecossistema',
  titulo: 'O ecossistema.',
  lead: 'As empresas cuja estrutura digital a Gois Group construiu ou opera aparecem aqui, ligadas ao centro pelo que construímos para cada uma. Só entram com autorização e com dados que possam ser conferidos.',
  vazio: 'Nenhuma empresa publicada.',
  cta: { rotulo: 'Ver o ecossistema completo', href: '/empresas/' },
} as const

/* ── Mapa, ficha e legenda (§9) ───────────────────────────────────────────── */
export const mapa = {
  rotuloLista: 'Empresas do ecossistema',
  centro: { nome: 'Gois Group', apoio: 'Método, design e engenharia' },
  reservado: 'Espaço reservado',
  oQueConstruimos: 'O que construímos',
  legenda: [
    { estado: 'em-operacao', rotulo: 'Em operação' },
    { estado: 'em-construcao', rotulo: 'Em construção' },
    { estado: 'em-evolucao', rotulo: 'Em evolução' },
    { estado: 'reservado', rotulo: 'Espaço reservado' },
  ],
  ficha: {
    semSelecao:
      'Passe o cursor ou navegue com o teclado por uma empresa para ver o que a Gois Group construiu para ela.',
    padrao:
      'Cada empresa publicada aqui aparece com nome, segmento, o que construímos, status, site e até dois números com fonte.',
    site: 'Site',
    verCase: 'Ver case',
  },
  lista: { site: 'Site', verCase: 'Ver case', abreNovaAba: '(abre em nova aba)' },
} as const

/* ── /empresas/ (§14.1) ───────────────────────────────────────────────────── */
export const paginaEmpresas = {
  meta: {
    title: 'Ecossistema',
    description:
      'Empresas cuja estrutura digital foi construída ou é operada pela Gois Group, cada uma com o que construímos para ela e dados que podem ser conferidos.',
  },
  rotulo: 'Ecossistema',
  h1: 'Ecossistema.',
  lead: 'Empresas cuja estrutura digital foi construída ou é operada pela Gois Group. Cada uma aparece com o que construímos para ela, e só com dados que possam ser conferidos.',
  vazio: 'Nenhuma empresa publicada.',
  alternador: { rotulo: 'Vista', mapa: 'Mapa', lista: 'Lista' },
  filtros: { status: 'Status', relacao: 'Relação' },
  bloco: {
    titulo: 'O que cada empresa publicada aqui terá.',
    itens: [
      'Nome e identidade — fornecidos pela própria empresa.',
      'Segmento e descrição.',
      'O que a Gois Group construiu: site, plataforma, sistema ou produto.',
      'Status: em operação, em construção ou em evolução.',
      'O site, para conferir ao vivo.',
      'Até três números, cada um com fonte e período.',
      'O case, quando houver.',
    ],
  },
  fecho: {
    texto: 'Precisa de uma estrutura assim? Comece por uma conversa.',
    cta: 'Iniciar um projeto',
    href: '/contato/?origem=empresas',
  },
} as const

/* ── /empresas/[slug]/ (§14.2) ────────────────────────────────────────────── */
export const paginaEmpresa = {
  trilha: { rotulo: 'Trilha', raiz: 'Ecossistema' },
  ficha: {
    rotulo: 'Ficha da empresa',
    segmento: 'Segmento',
    relacao: 'Relação com a Gois Group',
    status: 'Status',
    desde: 'Desde',
    site: 'Site',
    visitar: 'Visitar o site',
    abreNovaAba: '(abre em nova aba)',
  },
  /** seguido do nome da empresa e ponto final: "O que construímos para {Nome}." */
  h2Escopo: 'O que construímos para',
  h2Numeros: 'Números.',
  h2Case: 'Case.',
  navegacao: { rotulo: 'Outras empresas do ecossistema', anterior: 'Empresa anterior', proxima: 'Próxima empresa' },
  faixa: 'PÁGINA-MODELO — NÃO PUBLICADA. Os campos entre colchetes aguardam dados da Gois Group.',
  meta: { sufixo: 'Ecossistema' },
  metaModelo: {
    titulo: (codigo: string) => `Página-modelo ${codigo} — Ecossistema`,
    descricao: 'Página-modelo de empresa do ecossistema. Não publicada: os campos aguardam dados da Gois Group.',
  },
} as const
