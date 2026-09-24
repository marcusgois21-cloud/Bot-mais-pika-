/**
 * Variáveis de ambiente do site (spec §21.5). Todas são públicas (NEXT_PUBLIC_*) porque o site é estático.
 *
 * NEXT_PUBLIC_SITE_URL        domínio oficial (canonical, OG, sitemap). Ainda não informado: o fallback usa o
 *                             TLD reservado `.example`, visivelmente provisório.
 * NEXT_PUBLIC_SITE_ENV        'production' liga os bloqueios de publicação; qualquer outro valor = homologação
 *                             (robots Disallow + noindex).
 * NEXT_PUBLIC_SHOW_PENDING    '1' mostra as instruções dos dados pendentes e gera as páginas-modelo.
 * NEXT_PUBLIC_CONTACT_ENDPOINT / NEXT_PUBLIC_CONTACT_EMAIL   canais do formulário de contato.
 * NEXT_PUBLIC_BUILD_SHA / NEXT_PUBLIC_BUILD_DATE             definidos em next.config.ts.
 */
const FALLBACK_URL = 'https://gois-group.example'

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_URL).replace(/\/+$/, '')
export const SITE_URL_IS_PROVISIONAL = !process.env.NEXT_PUBLIC_SITE_URL

export const IS_PRODUCTION = process.env.NEXT_PUBLIC_SITE_ENV === 'production'
export const SHOW_PENDING = process.env.NEXT_PUBLIC_SHOW_PENDING === '1'

export const CONTACT_ENDPOINT = process.env.NEXT_PUBLIC_CONTACT_ENDPOINT || ''
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || ''

export const BUILD_SHA = process.env.NEXT_PUBLIC_BUILD_SHA || 'local'
export const BUILD_DATE = process.env.NEXT_PUBLIC_BUILD_DATE || '1970-01-01T00:00:00.000Z'
