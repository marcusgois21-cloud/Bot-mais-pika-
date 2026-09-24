import { NBSP, numero } from './formatar'

/**
 * Medição do layout real, no navegador (spec §6.2 e §15.3). Nenhum valor de exemplo: tudo o que estas
 * funções devolvem foi lido do DOM renderizado, na hora. Usada pela camada "Ver por dentro".
 *
 * Coordenadas em px CSS, relativas ao documento (não à janela), para a camada absoluta sobre a página.
 */

export type Caixa = { x: number; y: number; w: number; h: number }

/** A grade da página (spec §4.3), lida dos tokens em vigor: --cols, --gutter, --margin, --content-max. */
export type Grade = { colunas: number; gutter: number; margem: number; x: number; largura: number; coluna: number }

export function lerGrade(): Grade {
  const raiz = document.documentElement
  const cs = getComputedStyle(raiz)
  const colunas = parseInt(cs.getPropertyValue('--cols'), 10) || 12
  const gutter = parseFloat(cs.getPropertyValue('--gutter')) || 0
  const margem = parseFloat(cs.getPropertyValue('--margin')) || 0
  const maximo = parseFloat(cs.getPropertyValue('--content-max')) || Infinity
  const vw = raiz.clientWidth
  // espelha .grid: max-width = conteúdo máximo + 2 margens, centrada, com a margem por dentro
  const largura = Math.min(vw - 2 * margem, maximo)
  return { colunas, gutter, margem, x: (vw - largura) / 2, largura, coluna: (largura - (colunas - 1) * gutter) / colunas }
}

/** Quantas colunas da grade uma largura ocupa (com os intervalos entre elas). */
export function colunasOcupadas(w: number, g: Grade): number {
  return Math.max(1, Math.round((w + g.gutter) / (g.coluna + g.gutter)))
}

/**
 * Deslocamento de translate acumulado no elemento e nos ancestrais. As revelações (translateY), o
 * magnetismo dos botões e os pares de translates opostos (corte, papel) são movimento passageiro: a caixa
 * medida é a do layout, onde o elemento repousa.
 */
function deslocamento(el: Element): [number, number] {
  let dx = 0
  let dy = 0
  for (let n: Element | null = el; n && n !== document.documentElement; n = n.parentElement) {
    const cs = getComputedStyle(n)
    if (cs.transform && cs.transform !== 'none') {
      const m = new DOMMatrixReadOnly(cs.transform)
      dx += m.m41
      dy += m.m42
    }
    if (cs.translate && cs.translate !== 'none') {
      const [tx = '0', ty = '0'] = cs.translate.split(' ')
      dx += parseFloat(tx) || 0
      dy += parseFloat(ty) || 0
    }
  }
  return [dx, dy]
}

/** Caixa do elemento no documento, sem os translates passageiros. */
export function caixaNoDocumento(el: Element): Caixa {
  const r = el.getBoundingClientRect()
  const [dx, dy] = deslocamento(el)
  return { x: r.left + window.scrollX - dx, y: r.top + window.scrollY - dy, w: r.width, h: r.height }
}

/** Existe na tela: renderizado, com área e visível (display:none e visibility:hidden ficam de fora). */
export function renderizado(el: Element): boolean {
  if (!el.getClientRects().length) return false
  const r = el.getBoundingClientRect()
  return r.width >= 1 && r.height >= 1 && getComputedStyle(el).visibility !== 'hidden'
}

/** Dentro de uma camada fixa ou grudada (header, menu, pílula): não pertence ao documento que rola. */
export function emCamadaFixa(el: Element): boolean {
  for (let n: Element | null = el; n && n !== document.body; n = n.parentElement) {
    const pos = getComputedStyle(n).position
    if (pos === 'fixed' || pos === 'sticky') return true
  }
  return false
}

/** Altura do documento sem as camadas absolutas (a própria camada "por dentro" não a faz crescer). */
export function alturaDoDocumento(): number {
  return Math.max(document.body.offsetHeight, document.documentElement.clientHeight)
}

const px = (n: number) => `${numero(Math.round(n))}${NBSP}PX`
const TEXTO = /^(H[1-6]|P|BLOCKQUOTE|FIGCAPTION|DT|DD|LEGEND|LABEL)$/

/**
 * A segunda linha, técnica e medida (mono, caixa alta): tipografia para blocos de texto
 * ("ARCHIVO 580 · 76 PX"), itens e dimensões para listas, dimensões para o resto ("{w} × {h} PX").
 */
export function linhaTecnica(el: Element, c: Caixa): string {
  const dim = `${numero(Math.round(c.w))} × ${px(c.h)}`
  const tag = el.tagName.toUpperCase()
  if (TEXTO.test(tag)) {
    const cs = getComputedStyle(el)
    const familia = /martian/i.test(cs.fontFamily.split(',')[0]) ? 'MARTIAN MONO' : 'ARCHIVO'
    return `${familia} ${cs.fontWeight} · ${px(parseFloat(cs.fontSize))}`
  }
  if (tag === 'OL' || tag === 'UL') {
    const n = el.children.length
    return `${n} ${n === 1 ? 'ITEM' : 'ITENS'} · ${dim}`
  }
  if (tag === 'TABLE') {
    const n = el.querySelectorAll('tbody tr').length
    return `${n} ${n === 1 ? 'LINHA' : 'LINHAS'} · ${dim}`
  }
  if (tag === 'SVG') return `SVG · ${dim}`
  return dim
}

/** A linha técnica de um vazio deliberado: quantas colunas da grade ele guarda, e quanto mede. */
export function linhaDoVazio(c: Caixa, g: Grade): string {
  const n = colunasOcupadas(c.w, g)
  return `${n} ${n === 1 ? 'COLUNA' : 'COLUNAS'} · ${px(c.w)}`
}
