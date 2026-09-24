/** Contraste WCAG 2.x. Usado pelo Levantamento do hero, pela capacidade (derivados) e pelo modo "Ver por dentro". */
export function parseCor(cor: string): [number, number, number] | null {
  const hex = cor.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].replace(/./g, c => c + c) : hex[1]
    return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)) as [number, number, number]
  }
  const rgb = cor.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i)
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])]
  return null
}

function canal(c: number) {
  const s = c / 255
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}
export function luminancia([r, g, b]: [number, number, number]): number {
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b)
}
export function contraste(a: string, b: string): number | null {
  const ca = parseCor(a)
  const cb = parseCor(b)
  if (!ca || !cb) return null
  const [l1, l2] = [luminancia(ca), luminancia(cb)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}
