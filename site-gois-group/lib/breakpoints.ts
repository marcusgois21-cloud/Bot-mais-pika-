/** Única fonte de breakpoints para matchMedia — usada só para comportamento, nunca para DOM (spec §4.3). */
export const BP = { sm: 600, md: 900, lg: 1280, xl: 1680 } as const
export const mq = {
  sm: `(min-width: ${BP.sm}px)`,
  md: `(min-width: ${BP.md}px)`,
  lg: `(min-width: ${BP.lg}px)`,
  xl: `(min-width: ${BP.xl}px)`,
  ponteiroFino: '(hover: hover) and (pointer: fine)',
  toque: '(pointer: coarse)',
  menosMovimento: '(prefers-reduced-motion: reduce)',
} as const
