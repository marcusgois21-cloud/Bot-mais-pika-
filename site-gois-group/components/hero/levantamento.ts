/**
 * Levantamento (spec §6.2): o hero desenha um levantamento técnico de si mesmo, a partir do layout
 * medido. Este módulo é PURO — recebe medidas em px CSS e devolve a lista de exibição (caminhos SVG,
 * âncoras dos rótulos e valores das anotações). Nada de DOM, React ou imports de runtime: roda em Node.
 *
 * Coordenadas: x a partir da borda esquerda da caixa de conteúdo da grade; y a partir do topo do hero.
 * W vai até a borda direita do hero (inclui a margem direita); H é a altura do hero.
 * Traços de 1 px ficam em n + 0,5 para caírem inteiros em qualquer densidade de tela.
 */

export type Retangulo = { x: number; y: number; w: number; h: number }
/** Retângulo de texto devolvido pelo navegador (Range.getClientRects), já no sistema acima. */
export type RetanguloTexto = { esquerda: number; direita: number; topo: number; base: number }

export type LinhaVisual = RetanguloTexto & { centro: number }

export type Medidas = {
  W: number
  H: number
  /** largura da caixa de conteúdo da grade */
  largura: number
  colunas: number
  gutter: number
  /** --col-corte (1 = primeira coluna) */
  colunaCorte: number
  /** --corte-extra: deslocamento do repouso em px (xs e sm: o corte repousa na margem direita) */
  corteExtra?: number
  /** topo da caixa de conteúdo (topo do eyebrow) */
  topoConteudo: number
  /** altura do header fixo: o desenho útil começa abaixo dele */
  topoFaixa: number
  titulo: { fs: number; lh: number; linhas: LinhaVisual[] }
  eyebrow: Retangulo
  subtitulo: Retangulo
  cta: Retangulo
  /** o link secundário também é área de toque (legenda: "as áreas de toque do botão e do link") */
  ctaSecundario?: Retangulo
  /** anotações (--anotacoes): 0 = nenhuma (abaixo de lg) · 4 = sem a da versão (lg/xl baixo) · 5 = todas */
  anotacoes: number
}

export type AnotacaoId = 'grade' | 'titulo' | 'leitura' | 'botao' | 'versao'
export type Alinhar = 'topo' | 'centro' | 'base'
export type Anotacao = {
  id: AnotacaoId
  /** y da âncora: `topo` = a anotação começa nela; `centro` = centrada nela; `base` = termina nela */
  y: number
  alinhar: Alinhar
}
export type RotuloCota = {
  id: 'margem' | 'intervalo' | 'botao'
  /** valor medido, em px inteiros */
  px: number
  x: number
  y: number
  /** onde o rótulo fica em relação ao ponto: acima (centrado em x, base em y) ou à direita (começa em x, centrado em y) */
  lado: 'acima' | 'direita'
  /** o traço da cota e a sua extensão horizontal (x0…x1) — a cota só é desenhada com o rótulo */
  d: string
  x0: number
  x1: number
}

export type Levantamento = {
  W: number
  H: number
  colW: number
  margem: number
  xRepouso: number
  colunas: string
  intervalos: string
  baselines: string
  leitura: string
  caixas: string
  rotulosCota: RotuloCota[]
  anotacoes: Anotacao[]
  /** x de início do texto das anotações (--x-rest + 16 px) e largura disponível até o fim do conteúdo */
  anotacaoX: number
  anotacaoLargura: number
}

// Métricas da Archivo (hhea / OS/2, UPM 1000): ascendente 878, descendente 210, versal 686, altura-x 526.
const ASC = 0.878
const DESC = 0.21
const VERSAL = 0.686
const ALTURA_X = 0.526

const r1 = (n: number) => Math.round(n * 100) / 100
/** posição de um traço de 1 px: centro do pixel inteiro mais próximo */
const px = (n: number) => Math.round(n) + 0.5
const inteiro = (n: number) => Math.round(n)

/** Largura de coluna e x de cada coluna (0…cols−1), relativos à caixa de conteúdo. */
export function grade(largura: number, colunas: number, gutter: number) {
  const colW = (largura - (colunas - 1) * gutter) / colunas
  const colX = (i: number) => i * (colW + gutter)
  return { colW, colX }
}

/** Posição do corte para o valor v do range (0…cols): borda esquerda da coluna v+1; cols = borda direita. */
export function posicaoDaColuna(v: number, largura: number, colunas: number, gutter: number): number {
  if (v >= colunas) return largura
  return Math.max(0, v) * grade(largura, colunas, gutter).colW + Math.max(0, v) * gutter
}

/** Valor do range mais próximo de uma posição x do corte. */
export function colunaMaisProxima(x: number, largura: number, colunas: number, gutter: number): number {
  let melhor = 0
  let dist = Infinity
  for (let v = 0; v <= colunas; v++) {
    const d = Math.abs(posicaoDaColuna(v, largura, colunas, gutter) - x)
    if (d < dist) {
      dist = d
      melhor = v
    }
  }
  return melhor
}

/** Amortecimento independente da taxa de quadros (spec §6.3): x += (alvo − x) · (1 − 0,82^(dt/16,67)). */
export function amortecer(x: number, alvo: number, dt: number): number {
  return x + (alvo - x) * (1 - Math.pow(0.82, dt / 16.67))
}

/**
 * Agrupa retângulos de texto com o mesmo topo (± 1 px) numa linha visual. Vale para qualquer quebra.
 * Retângulos vazios (espaços) devem ser descartados antes.
 */
export function linhasVisuais(rets: RetanguloTexto[]): LinhaVisual[] {
  const ordenados = [...rets].sort((a, b) => a.topo - b.topo || a.esquerda - b.esquerda)
  const linhas: LinhaVisual[] = []
  for (const r of ordenados) {
    const ultima = linhas[linhas.length - 1]
    if (ultima && Math.abs(ultima.topo - r.topo) <= 1) {
      ultima.esquerda = Math.min(ultima.esquerda, r.esquerda)
      ultima.direita = Math.max(ultima.direita, r.direita)
      ultima.base = Math.max(ultima.base, r.base)
      ultima.centro = (ultima.topo + ultima.base) / 2
    } else {
      linhas.push({ ...r, centro: (r.topo + r.base) / 2 })
    }
  }
  return linhas
}

/**
 * Linhas de leitura de uma linha de texto. A área de conteúdo (ascendente + descendente = 1,088 em) fica
 * centrada na caixa de linha, então: base = centro + (0,878 − 1,088/2)·fs; altura-x = base − 0,526·fs;
 * versal = base − 0,686·fs. Equivale a `base = topo + (lh − 1,088·fs)/2 + 0,878·fs` da spec.
 */
export function linhasDeLeitura(centro: number, fs: number) {
  const base = centro + (ASC - (ASC + DESC) / 2) * fs
  return { versal: base - VERSAL * fs, alturaX: base - ALTURA_X * fs, base }
}

function retangulo(x0: number, y0: number, x1: number, y1: number): string {
  const a = px(x0)
  const b = px(x1 - 1)
  const c = px(y0)
  const d = px(y1 - 1)
  return `M${a} ${c}H${b}V${d}H${a}Z`
}

/**
 * Caixas das linhas do H1. Linhas consecutivas dividem a aresta horizontal: ela é desenhada uma vez só,
 * com a extensão das duas, para o tracejado não se sobrepor a si mesmo.
 */
function caixasDasLinhas(linhas: LinhaVisual[], lh: number): string {
  if (!linhas.length) return ''
  const caixas = linhas.map(l => ({ x0: l.esquerda, x1: l.direita, y0: l.centro - lh / 2, y1: l.centro + lh / 2 }))
  let d = ''
  caixas.forEach((c, i) => {
    const ant = caixas[i - 1]
    if (!ant || Math.abs(ant.y1 - c.y0) > 1) {
      if (ant) d += `M${px(ant.x0)} ${px(ant.y1 - 1)}H${px(ant.x1 - 1)}`
      d += `M${px(c.x0)} ${px(c.y0)}H${px(c.x1 - 1)}`
    } else {
      d += `M${px(Math.min(ant.x0, c.x0))} ${px(c.y0)}H${px(Math.max(ant.x1, c.x1) - 1)}`
    }
    d += `M${px(c.x0)} ${px(c.y0)}V${px(c.y1 - 1)}M${px(c.x1 - 1)} ${px(c.y0)}V${px(c.y1 - 1)}`
  })
  const u = caixas[caixas.length - 1]
  d += `M${px(u.x0)} ${px(u.y1 - 1)}H${px(u.x1 - 1)}`
  return d
}

/** Cota horizontal com dois traços de 6 px nas pontas. */
function cotaH(x0: number, x1: number, y: number): string {
  const a = px(x0)
  const b = px(x1 - 1)
  const c = px(y)
  return `M${a} ${c}H${b}M${a} ${c - 3}V${c + 3}M${b} ${c - 3}V${c + 3}`
}
/** Cota vertical com dois traços de 6 px nas pontas. */
function cotaV(x: number, y0: number, y1: number): string {
  const a = px(x)
  const b = px(y0)
  const c = px(y1 - 1)
  return `M${a} ${b}V${c}M${a - 3} ${b}H${a + 3}M${a - 3} ${c}H${a + 3}`
}

/** A lista de exibição. */
export function levantamento(m: Medidas): Levantamento {
  const { W, H, largura, colunas, gutter } = m
  const { colW, colX } = grade(largura, colunas, gutter)
  const Hi = inteiro(H)

  // 1. colunas: as duas arestas de cada coluna, de ponta a ponta
  let colunasD = ''
  for (let i = 0; i < colunas; i++) {
    colunasD += `M${px(colX(i))} 0V${Hi}M${px(colX(i) + colW - 1)} 0V${Hi}`
  }

  // 2. intervalos: um retângulo por gutter (preenchido com hachura)
  let intervalosD = ''
  for (let i = 0; i < colunas - 1; i++) {
    const a = inteiro(colX(i) + colW)
    const b = inteiro(colX(i + 1))
    if (b > a) intervalosD += `M${a} 0H${b}V${Hi}H${a}Z`
  }

  // 3. linhas de base de 24 em 24 px a partir do topo do conteúdo
  let baselinesD = ''
  const Wi = inteiro(W)
  for (let y = m.topoConteudo; y < H - 1; y += 24) baselinesD += `M0 ${px(y)}H${Wi}`

  // 4. leitura: versal, altura-x e base de cada linha do H1, da esquerda da linha até a borda do hero
  let leituraD = ''
  const leituras = m.titulo.linhas.map(l => linhasDeLeitura(l.centro, m.titulo.fs))
  m.titulo.linhas.forEach((l, i) => {
    const { versal, alturaX, base } = leituras[i]
    for (const y of [versal, alturaX, base]) leituraD += `M${px(l.esquerda)} ${px(y)}H${Wi}`
  })

  // 5. caixas: linhas do H1, eyebrow, subtítulo e as duas áreas de toque
  let caixasD = caixasDasLinhas(m.titulo.linhas, m.titulo.lh)
  for (const r of [m.eyebrow, m.subtitulo, m.cta, m.ctaSecundario]) {
    if (r && r.w > 0 && r.h > 0) caixasD += retangulo(r.x, r.y, r.x + r.w, r.y + r.h)
  }

  // 6. cotas: (a) margem direita a H − 40; (b) um intervalo na faixa, acima do conteúdo;
  //    (c) altura do CTA, vertical a 12 px da direita do botão. Sem intervalo na faixa (xs), sem cota (b).
  const margem = W - largura
  const yA = H - 40
  const k = Math.max(m.colunaCorte - 1, 0) // intervalo logo à direita do corte em repouso (se existir)
  const gA = colX(k) + colW
  const gB = k + 1 < colunas ? colX(k + 1) : gA
  // (b) fica logo acima do conteúdo, na faixa entre a alça e a dica (header + 16 … + 64) e o eyebrow —
  //     só quando essa faixa existe (telas baixas não têm folga para ela)
  const folga = m.topoConteudo - (m.topoFaixa + 40)
  const yB = m.topoConteudo - 14
  const xC = m.cta.x + m.cta.w + 12
  const rotulosCota: RotuloCota[] = []
  if (margem >= 12) {
    rotulosCota.push({ id: 'margem', px: inteiro(margem), x: (largura + W) / 2, y: px(yA) - 6, lado: 'acima', d: cotaH(largura, W, yA), x0: largura, x1: W })
  }
  if (colunas > 1 && gB > gA && folga >= 48) {
    // o intervalo é estreito demais para o texto entre os traços: o rótulo vai à direita da cota
    rotulosCota.push({ id: 'intervalo', px: inteiro(gutter), x: inteiro(gB) + 6, y: px(yB), lado: 'direita', d: cotaH(gA, gB, yB), x0: gA, x1: gB })
  }
  if (m.cta.h > 0) {
    rotulosCota.push({ id: 'botao', px: inteiro(m.cta.h), x: px(xC), y: px(m.cta.y) - 6, lado: 'acima', d: cotaV(xC, m.cta.y, m.cta.y + m.cta.h), x0: xC - 3, x1: xC + 4 })
  }

  // 7. anotações (lg/xl): âncoras — a da versão é a primeira a sair quando falta altura
  const xRepouso = colX(Math.max(0, m.colunaCorte - 1)) + (m.corteExtra ?? 0)
  const anotacoes: Anotacao[] = []
  if (m.anotacoes > 0) {
    const l1 = leituras[0]
    const l2 = leituras[1] ?? leituras[0]
    anotacoes.push({ id: 'grade', y: m.eyebrow.y, alinhar: 'topo' })
    if (l1) anotacoes.push({ id: 'titulo', y: l1.versal, alinhar: 'topo' })
    if (l2) anotacoes.push({ id: 'leitura', y: l2.base, alinhar: 'topo' })
    anotacoes.push({ id: 'botao', y: m.cta.y + m.cta.h / 2, alinhar: 'centro' })
    if (m.anotacoes >= 5) anotacoes.push({ id: 'versao', y: H - 32, alinhar: 'base' })
  }

  return {
    W,
    H,
    colW: r1(colW),
    margem: r1(margem),
    xRepouso: r1(xRepouso),
    colunas: colunasD,
    intervalos: intervalosD,
    baselines: baselinesD,
    leitura: leituraD,
    caixas: caixasD,
    rotulosCota,
    anotacoes,
    anotacaoX: r1(xRepouso + 16),
    anotacaoLargura: Math.max(0, r1(largura - (xRepouso + 16))),
  }
}

/** Topo de uma caixa de altura h alinhada à âncora y. */
export const topoAlinhado = (y: number, h: number, alinhar: Alinhar) =>
  alinhar === 'base' ? y - h : alinhar === 'centro' ? y - h / 2 : y

/**
 * Segunda passagem das anotações (spec §6.2, passo 6): se a anotação i sobrepõe a anterior, desce até
 * `anterior.base + gap`. Se a última passar do limite inferior, a pilha sobe de baixo para cima,
 * mantendo o mesmo intervalo — nenhuma anotação sai do hero. Devolve o topo de cada uma.
 */
export function resolverColisoes(
  itens: { y: number; h: number; alinhar: Alinhar }[],
  gap: number,
  limiteInferior: number,
  limiteSuperior = 0,
): number[] {
  const topos = itens.map(it => topoAlinhado(it.y, it.h, it.alinhar))
  for (let i = 1; i < topos.length; i++) {
    const minimo = topos[i - 1] + itens[i - 1].h + gap
    if (topos[i] < minimo) topos[i] = minimo
  }
  for (let i = topos.length - 1; i >= 0; i--) {
    const maximo = i === topos.length - 1 ? limiteInferior - itens[i].h : topos[i + 1] - gap - itens[i].h
    if (topos[i] > maximo) topos[i] = maximo
  }
  return topos.map(t => Math.max(limiteSuperior, Math.round(t)))
}

/** Mantém um rótulo de largura `w` dentro de [margem, W − margem], centrado em x quando cabe. */
export function posicionarRotulo(x: number, w: number, W: number, margem = 4): number {
  return Math.min(Math.max(x - w / 2, margem), W - margem - w)
}

/**
 * Em repouso, uma cota (traço + rótulo, de x0 a x1) ou aparece inteira na janela à direita do corte, a
 * 4 px dele, ou fica inteira atrás da superfície (surge quando o corte se move). Nunca cortada pela linha.
 */
export function inteiraEmRepouso(x0: number, x1: number, xRepouso: number): boolean {
  return x1 <= xRepouso || x0 >= xRepouso + 4
}

/**
 * Traço de chamada (spec §6.2, passo 6): quando a colisão afasta a anotação mais de 24 px da posição da
 * âncora, um colchete liga as duas no corredor livre entre o corte e as anotações (os 10 px antes do fundo
 * delas, que recorta as linhas): sai do corte na altura da âncora, corre 4 px à direita dele e entra na
 * anotação na altura da linha principal (15 px abaixo do topo: 4 de respiro + meia entrelinha).
 */
export function chamada(a: Anotacao, topo: number, h: number, xRepouso: number): string {
  if (Math.abs(topo - topoAlinhado(a.alinhar === 'topo' ? a.y + 1 : a.y, h, a.alinhar)) <= 24) return ''
  return `M${px(xRepouso + 1)} ${px(a.y)}H${px(xRepouso + 5)}V${px(topo + 15)}H${px(xRepouso + 9)}`
}
