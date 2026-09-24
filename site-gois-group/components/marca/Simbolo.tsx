/**
 * Símbolo "G em corte" (spec §5.1). Grade 48 × 48, módulo 4; a fenda vertical (x 28–32) é o corte.
 * Variantes hintadas a 16 e 32 px. Sempre giz/tinta via currentColor — nunca Rubrica.
 */
type Props = { tamanho?: number; className?: string; titulo?: string }

const MESTRE = (
  <>
    <path d="M0 0H48V8H8V40H28V48H0Z" />
    <path d="M32 20H48V48H32V40H40V28H32Z" />
  </>
)
const V32 = (
  <>
    <path d="M0 0H32V5H5V27H19V32H0Z" />
    <path d="M22 13H32V32H22V27H27V18H22Z" />
  </>
)
const V16 = (
  <>
    <path d="M0 0H16V3H3V13H9V16H0Z" />
    <path d="M11 7H16V16H11V13H13V10H11Z" />
  </>
)

export function Simbolo({ tamanho = 24, className, titulo }: Props) {
  const [vb, paths] = tamanho <= 20 ? [16, V16] : tamanho <= 36 && tamanho % 12 !== 0 ? [32, V32] : [48, MESTRE]
  return (
    <svg
      viewBox={`0 0 ${vb} ${vb}`}
      width={tamanho}
      height={tamanho}
      fill="currentColor"
      className={className}
      shapeRendering="crispEdges"
      aria-hidden={titulo ? undefined : true}
      role={titulo ? 'img' : undefined}
      aria-label={titulo}
      focusable="false"
    >
      {paths}
    </svg>
  )
}
