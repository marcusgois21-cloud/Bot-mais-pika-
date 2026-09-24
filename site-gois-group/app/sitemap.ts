import type { MetadataRoute } from 'next'
import { url } from '@/lib/seo'
import { empresas } from '@/content/empresas'
import { casos } from '@/content/cases'
import { site } from '@/content/site'
import { publicada } from '@/lib/conteudo'
import { BUILD_DATE } from '@/lib/env'

export const dynamic = 'force-static'

/** Só rotas publicadas: sem placeholders, sem 404; /privacidade/ só quando publicada (spec §18.2). */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = BUILD_DATE
  const rotas = ['/', '/empresas/', '/cases/', '/sobre/', '/contato/']
  if (site.privacidade.publicada) rotas.push('/privacidade/')
  for (const e of empresas.filter(publicada)) rotas.push(`/empresas/${e.slug}/`)
  for (const c of casos.filter(publicada)) rotas.push(`/cases/${c.slug}/`)
  return rotas.map(r => ({ url: url(r), lastModified }))
}
