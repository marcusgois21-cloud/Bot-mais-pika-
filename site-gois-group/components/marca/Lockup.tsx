import { WORDMARK } from './wordmark.generated'

/**
 * Lockup horizontal (spec §5.3): símbolo S = 2h centrado na altura de versal h; espaço 0,75h.
 * `altura` = h (altura de versal do wordmark) em px. Header: h = 12 → lockup ≈ 171 px.
 */
export function Lockup({ altura = 12, className }: { altura?: number; className?: string }) {
  const h = WORDMARK.versal // unidades da fonte
  const S = 2 * h
  const esp = 0.75 * h
  const largura = S + esp + WORDMARK.largura
  const escala = altura / h
  return (
    <svg
      viewBox={`0 0 ${largura} ${S}`}
      width={Math.round(largura * escala)}
      height={Math.round(S * escala)}
      fill="currentColor"
      className={className}
      aria-hidden="true"
      focusable="false"
      overflow="visible"
    >
      <g transform={`scale(${S / 48})`} shapeRendering="crispEdges">
        <path d="M0 0H48V8H8V40H28V48H0Z" />
        <path d="M32 20H48V48H32V40H40V28H32Z" />
      </g>
      <g transform={`translate(${S + esp - WORDMARK.xmin} ${(S - h) / 2})`}>
        <path d={WORDMARK.d} />
      </g>
    </svg>
  )
}
