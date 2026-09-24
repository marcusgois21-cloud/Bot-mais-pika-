import { validar, type Case, type Empresa, type Texto } from '@/lib/conteudo'
import { pending, type Maybe, type Pending } from '@/lib/pending'
import { NBSP } from '@/lib/formatar'

/**
 * Copy da prova (spec §8-07, §12, §13.3, §13.4, §14.3–14.5, §18.1). Texto final: vai ao ar como está.
 * Compromissos [VALIDAR] via validar(): o build de produção falha enquanto não forem aprovados.
 * Sem setas em texto (as setas são SVG) e unidades com U+00A0.
 */

/* ── Home 07 · Por que a Gois Group ─────────────────────────────────────────── */

export type Compromisso = { id: string; termo: Texto; explicacao: string; comoVerificar: string }

export const porQue = {
  rotulo: 'Por que a Gois Group',
  titulo: 'Não pedimos que acredite. Pedimos que verifique.',
  intro:
    'Qualquer empresa pode prometer qualidade. Estes são pontos que você pode conferir por escrito — antes de assinar e depois de lançar.',
  rotuloComoVerificar: 'Como verificar',
  compromissos: [
    {
      id: 'metrica',
      termo: validar('Métrica antes do layout.'),
      explicacao: 'O que conta como sucesso é definido e medido na primeira fase, antes de qualquer tela.',
      comoVerificar: 'Peça o documento de objetivos da Leitura. Ele vem antes do primeiro desenho.',
    },
    {
      id: 'orcamento',
      termo: validar('Orçamento de desempenho.'),
      explicacao:
        'Peso de página e tempo de carregamento são acordados na fase de Arquitetura. Uma entrega que estoura o orçamento não está pronta.',
      comoVerificar: 'Teste qualquer página entregue no PageSpeed Insights.',
    },
    {
      id: 'acessibilidade',
      termo: validar('Acessibilidade como critério de entrega.'),
      explicacao:
        'Teclado, contraste, semântica e leitores de tela verificados contra a WCAG 2.2, nível AA, antes do lançamento.',
      comoVerificar: 'Navegue sem mouse. Ligue um leitor de tela.',
    },
    {
      id: 'propriedade',
      termo: validar('O que é seu fica com você.'),
      explicacao: 'Código, domínio, contas, conteúdo e dados no nome da sua empresa desde o primeiro dia.',
      comoVerificar: 'Confira quem é o titular de cada conta.',
    },
    {
      id: 'documentacao',
      termo: validar('Documentação que sobrevive a nós.'),
      explicacao:
        'Arquitetura, decisões e rotinas registradas para que qualquer equipe competente consiga manter o site.',
      comoVerificar: 'Peça o repositório e a documentação na entrega.',
    },
    {
      id: 'lancamento',
      termo: validar('O lançamento é o dia um.'),
      explicacao: 'Depois de lançar, o site entra em ciclos de medição e evolução, com um relatório por ciclo.',
      comoVerificar: 'Cada relatório traz duas colunas: antes e depois.',
    },
  ] satisfies readonly Compromisso[],
  /** Compromisso ao lado do qual aparece o p75 de LCP dos sites entregues, quando confirmado (spec §13.1). */
  compromissoDoLcp: 'orcamento',
  linhaFonteLcp: (fonte: string, periodo: string, verificado: string) =>
    `Fonte: ${fonte} · Período: ${periodo} · Verificado em ${verificado}`,
  prova: {
    titulo: 'O primeiro case é este site.',
    intro:
      'Há números que você pode conferir sozinho, agora: os desta página, no seu aparelho. Nenhum deles foi digitado por nós.',
    legenda:
      'Medido no seu dispositivo, nesta visita, pela API de Performance do navegador. Varia com a rede e o aparelho — por isso mostramos o seu número, não o nosso.',
    linkCase: 'Ver o Case Nº 000: este site',
    linkTodos: 'Ver todos os cases',
    rotuloOutros: 'Outros cases',
  },
} as const

/* ── Medição ao vivo (spec §13.3) ─────────────────────────────────────────── */

export type ChaveMedicao = 'transferido' | 'arquivos' | 'lcp' | 'cls' | 'inp'

export const medicao = {
  celulas: [
    { chave: 'transferido', rotulo: 'Transferido nesta visita', tecnica: 'transferSize', referencia: null },
    { chave: 'arquivos', rotulo: 'Arquivos carregados', tecnica: 'Resource Timing', referencia: null },
    {
      chave: 'lcp',
      rotulo: 'Conteúdo principal visível em',
      tecnica: 'LCP',
      referencia: `Referência para “bom”: até 2,5${NBSP}s.`,
    },
    {
      chave: 'cls',
      rotulo: 'Quanto a página se mexeu ao carregar',
      tecnica: 'CLS',
      referencia: 'Referência para “bom”: até 0,1.',
    },
    {
      chave: 'inp',
      rotulo: 'Resposta mais lenta a um toque ou clique',
      tecnica: 'INP (aproximação)',
      referencia: `Referência para “bom”: até 200${NBSP}ms.`,
    },
  ] as const satisfies readonly { chave: ChaveMedicao; rotulo: string; tecnica: string; referencia: string | null }[],
  emCache: `Em cache — 0${NBSP}KB transferidos`,
  semSuporte: 'Não medido neste navegador.',
  interaja: 'Interaja com a página para medir.',
  /**
   * Quando a visita começou em outra página deste site (navegação sem recarregar), LCP e CLS
   * são os da primeira página — a linha técnica diz isso, para o rótulo não afirmar mais do que mede.
   */
  daPrimeiraPagina: 'da primeira página desta visita',
  /** Antes da primeira leitura (e sem JavaScript). */
  semLeitura: '—',
} as const

export type CopyMedicao = typeof medicao

/* ── Métricas de build do Case Nº 000 (spec §13.4) ───────────────────────── */

export type ChaveBuild = 'totalKB' | 'jsKB' | 'cssKB' | 'fontesKB' | 'requisicoes'

export const metricasBuild = {
  linhas: [
    {
      chave: 'totalKB',
      rotulo: 'Peso da página inicial (comprimido)',
      traducao: 'Quanto o navegador precisa baixar para mostrar a página inicial.',
    },
    {
      chave: 'jsKB',
      rotulo: 'JavaScript da página inicial (comprimido)',
      traducao: 'O código que roda no seu aparelho. Quanto menor, mais rápido responde.',
    },
    { chave: 'cssKB', rotulo: 'CSS (comprimido)', traducao: 'As regras visuais da página.' },
    { chave: 'fontesKB', rotulo: 'Fontes', traducao: 'As duas famílias tipográficas do site.' },
    {
      chave: 'requisicoes',
      rotulo: 'Requisições na primeira visita',
      traducao: 'Quantos arquivos a página inicial pede ao servidor.',
    },
  ] as const satisfies readonly { chave: ChaveBuild; rotulo: string; traducao: string }[],
  colunas: ['Métrica', 'Valor', 'Versão', 'Data', 'Fonte', 'Método'] as const,
  /** Iguais aos campos `gerador` e `metodo` gravados por scripts/measure-build.mjs. */
  fonte: 'scripts/measure-build.mjs',
  metodoPeso: 'gzip -9 dos arquivos que a página inicial carrega',
  metodoContagem: 'Contagem dos arquivos que a página inicial carrega',
  unidadePeso: 'KB',
  linhaFonte: { fonte: 'Fonte: scripts/measure-build.mjs', versao: 'Versão', metodo: 'Método: gzip -9' },
  linkJson: 'Ver as medições em JSON',
  falha: 'Medições indisponíveis nesta versão.',
  linkVisita: 'Ver as medições desta visita',
  /** Métrica-chave da linha do Nº 000 em /cases/ (spec §14.3). */
  pesoDaHome: 'Peso da página inicial',
  versao: 'versão',
} as const

export type CopyMetricasBuild = typeof metricasBuild

/* ── /cases/ (spec §14.3, §14.4, §12.4) ───────────────────────────────────── */

export const paginaCases = {
  rotulo: 'Cases',
  h1: 'Cases, com fonte.',
  lead:
    'Cada case mostra o problema, a estratégia, o que foi construído e o que mudou — com a origem de cada número. Sem autorização ou sem dados verificáveis, o case não entra aqui.',
  rotuloRegistro: 'Registro de cases',
  colunas: { numero: 'Nº', caso: 'Case', estrutura: 'Estrutura', metrica: 'Métrica-chave, com fonte' },
  codigo: (numero: string) => `Nº ${numero}`,
  reservado: 'Espaço reservado para case',
  fonte: 'Fonte:',
  /** Resumo oculto das linhas reservadas (que são aria-hidden, spec §7.4). */
  resumoReservados: (codigos: string[]) =>
    `${codigos.join(' e ')}: ${codigos.length > 1 ? 'espaços reservados' : 'espaço reservado'} para case, sem conteúdo publicado.`,
  todoCase: { titulo: 'O que todo case publicado aqui terá.' },
} as const

/* ── /cases/[slug]/ (spec §14.5) ──────────────────────────────────────────── */

export const paginaCase = {
  trilha: 'Trilha',
  codigo: (numero: string) => `Case Nº ${numero}`,
  meta: { empresa: 'Empresa', estrutura: 'Estrutura', periodo: 'Período', status: 'Status', site: 'Site' },
  verOSite: 'Ver o site',
  /** O Nº 000 é da própria Gois Group. */
  empresaPropria: { nome: 'Gois Group', href: '/sobre/' },
  empresaPendente: pending('[EMPRESA DO CASE — a confirmar]') as Pending,
  ate: 'até',
  /** Produção, com o início do projeto pendente: a linha de período mostra só a data de lançamento (spec §22.1). */
  somenteLancamento: (data: string) => `Até ${data}`,
  capitulo: (n: number, titulo: string) => `${String(n).padStart(2, '0')} — ${titulo}`,
  indice: { rotulo: 'Capítulos', aria: 'Capítulos do case' },
  /** Âncoras dos capítulos, na ordem de CAPITULOS (content/cases.ts). */
  ancoras: {
    problema: 'problema',
    oportunidade: 'oportunidade',
    estrategia: 'estrategia',
    construcao: 'construcao',
    passouAExistir: 'o-que-passou-a-existir',
    resultado: 'resultado',
    metricas: 'metricas',
  },
  faixaModelo: 'PÁGINA-MODELO — NÃO PUBLICADA. Os campos entre colchetes aguardam dados da Gois Group.',
  stack: { caption: (numero: string) => `Tecnologias do case Nº ${numero}`, colunas: ['Tecnologia', 'Para quê'] as const },
  metricas: {
    caption: (numero: string) => `Métricas do case Nº ${numero}`,
    regiao: 'Métricas, role para os lados',
    colunas: ['Métrica', 'Antes', 'Depois', 'Variação', 'Período', 'Fonte', 'Método'] as const,
    de: 'de',
    para: 'para',
  },
  fim: {
    empresa: 'Empresa relacionada',
    proximo: 'Próximo case',
    todos: 'Cases',
    verTodos: 'Ver todos os cases',
    projeto: 'Próximo passo',
    iniciar: 'Iniciar um projeto',
  },
} as const

/* ── Metadados (spec §18.1) ───────────────────────────────────────────────── */

export const seoCases = {
  lista: {
    title: 'Cases, com fonte',
    description:
      'Sites e sistemas construídos pela Gois Group, contados do problema ao resultado, com fonte, período e método de cada número.',
  },
  /** Descrição própria por slug; sem ela, a tese do case. */
  descricoes: {
    'este-site':
      'O primeiro case da Gois Group é o próprio site: construído em duas camadas, medido a cada versão e aberto para quem quiser ver por dentro.',
  } as Record<string, string>,
  titulo: (titulo: string, numero: string) => `${titulo.replace(/\.$/, '')} — Case Nº ${numero}`,
  modelo: {
    titulo: (numero: string) => `Página-modelo — Case Nº ${numero}`,
    description: 'Página-modelo de case, não publicada. Os campos entre colchetes aguardam dados da Gois Group.',
  },
} as const

/* ── Resolução de dados usada pelas páginas ───────────────────────────────── */

/** Nome da empresa do case: a empresa relacionada; o Nº 000 é da própria Gois Group; placeholder = pendente. */
export function empresaDoCase(c: Case, empresas: readonly Empresa[]): Maybe<string> {
  const e = c.empresaSlug ? empresas.find(x => x.slug === c.empresaSlug) : undefined
  if (e) return e.nome
  return c.placeholder ? paginaCase.empresaPendente : paginaCase.empresaPropria.nome
}
