import type { MetadataRoute } from 'next'
import { IS_PRODUCTION } from '@/lib/env'
import { url } from '@/lib/seo'

export const dynamic = 'force-static'

/** Homologação: Disallow total. Produção: tudo liberado + sitemap. */
export default function robots(): MetadataRoute.Robots {
  if (!IS_PRODUCTION) return { rules: { userAgent: '*', disallow: '/' } }
  return { rules: { userAgent: '*', allow: '/' }, sitemap: url('/sitemap.xml') }
}
