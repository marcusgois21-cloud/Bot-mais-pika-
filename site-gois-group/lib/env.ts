/**
 * URL pública do site. Defina NEXT_PUBLIC_SITE_URL no build de produção
 * (ex.: NEXT_PUBLIC_SITE_URL=https://seudominio.com.br npm run build).
 * O domínio oficial ainda não foi informado, então o fallback usa o TLD reservado
 * `.example` — canonical/OG ficam visivelmente provisórios até a variável existir.
 */
const FALLBACK_URL = 'https://gois-group.example'

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_URL).replace(/\/+$/, '')

export const SITE_URL_IS_PROVISIONAL = !process.env.NEXT_PUBLIC_SITE_URL

if (SITE_URL_IS_PROVISIONAL && process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
  console.warn('\n[gois-group] NEXT_PUBLIC_SITE_URL não definida: canonical, sitemap e Open Graph usam ' + FALLBACK_URL + '\n')
}
