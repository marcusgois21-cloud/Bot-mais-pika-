/** Formatação pt-BR (spec §4.2 · Números). Unidades separadas por U+00A0. Nada de "+" ou "mais de". */
export const NBSP = ' '

const inteiro = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })

export function numero(n: number, casas = 0): string {
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas }).format(n)
}
export function comUnidade(n: number, unidade: string, casas = 0): string {
  return `${numero(n, casas)}${NBSP}${unidade}`
}
export function kb(bytes: number, casas = 1): string {
  return comUnidade(bytes / 1024, 'KB', casas)
}
export function segundos(ms: number): string {
  return comUnidade(ms / 1000, 's', 2)
}
export function ms(n: number): string {
  return comUnidade(Math.round(n), 'ms')
}
export function contagem(n: number): string {
  return inteiro.format(n)
}

const POR_EXTENSO = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez']
/** Até dez, por extenso no texto corrido. */
export function porExtenso(n: number, maiuscula = false): string {
  const s = n >= 0 && n <= 10 ? POR_EXTENSO[n] : contagem(n)
  return maiuscula ? s.charAt(0).toUpperCase() + s.slice(1) : s
}

/** dd.mm.aaaa a partir de ISO. */
export function dataCurta(iso: string): string {
  const d = new Date(iso)
  const dd = String(d.getUTCDate()).padStart(2, '0')
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  return `${dd}.${mm}.${d.getUTCFullYear()}`
}
export function ano(iso: string): number {
  return new Date(iso).getUTCFullYear()
}
