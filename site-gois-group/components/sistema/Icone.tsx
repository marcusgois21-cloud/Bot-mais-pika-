/** Ícones SVG inline (spec §4.6). viewBox 12 × 12, traço quadrado de 1,5, currentColor. */
const PATHS = {
  'seta-direita': 'M1 6H10.5M6.5 2L10.5 6L6.5 10',
  'seta-esquerda': 'M11 6H1.5M5.5 2L1.5 6L5.5 10',
  'seta-baixo': 'M6 1V10.5M2 6.5L6 10.5L10 6.5',
  'seta-cima': 'M6 11V1.5M2 5.5L6 1.5L10 5.5',
  externo: 'M3 9L9.5 2.5M4 2.5H9.5V8',
} as const

export type NomeIcone = keyof typeof PATHS

export function Icone({ nome, tamanho = 12, className }: { nome: NomeIcone; tamanho?: number; className?: string }) {
  const dir = nome.startsWith('seta-') ? ` seta seta--${nome.slice(5)}` : ''
  return (
    <svg
      viewBox="0 0 12 12"
      width={tamanho}
      height={tamanho}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="square"
      className={`${className ?? ''}${dir}`.trim()}
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[nome]} />
    </svg>
  )
}

export function Seta({ dir = 'direita', tamanho = 12, className }: { dir?: 'direita' | 'esquerda' | 'baixo' | 'cima'; tamanho?: number; className?: string }) {
  return <Icone nome={`seta-${dir}` as NomeIcone} tamanho={tamanho} className={className} />
}

export function IconeErro({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 14 14" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="square" className={className} aria-hidden="true" focusable="false">
      <rect x=".75" y=".75" width="12.5" height="12.5" />
      <path d="M7 3.5V8.5M7 10.25V10.5" />
    </svg>
  )
}
