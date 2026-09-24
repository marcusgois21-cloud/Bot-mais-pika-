import localFont from 'next/font/local'

/** Archivo (display, texto, UI) — só o eixo wght, 34,9 KB, com preload: é a fonte do LCP. */
export const archivo = localFont({
  src: '../node_modules/@fontsource-variable/archivo/files/archivo-latin-wght-normal.woff2',
  weight: '100 900',
  style: 'normal',
  display: 'swap',
  preload: true,
  variable: '--font-archivo',
  adjustFontFallback: 'Arial',
  fallback: ['Arial', 'sans-serif'],
})

/** Martian Mono — medida ou código, nada mais. Sem preload. */
export const martian = localFont({
  src: '../node_modules/@fontsource-variable/martian-mono/files/martian-mono-latin-wght-normal.woff2',
  weight: '100 800',
  style: 'normal',
  display: 'swap',
  preload: false,
  variable: '--font-martian',
  adjustFontFallback: false,
  fallback: ['Martian Fallback', 'ui-monospace', 'monospace'],
})
