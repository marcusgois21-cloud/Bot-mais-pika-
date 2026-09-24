import type { Metadata } from 'next'
import { IS_PRODUCTION, SITE_URL } from './env'
import { site } from '@/content/site'
import { known } from './pending'

export const TITULO_PADRAO = 'Gois Group — Desenvolvimento de sites e sistemas web'
export const OG_IMAGE = { url: '/og/default.png', width: 1200, height: 630, alt: 'Gois Group — Construímos sites de dentro para fora.' }

export function url(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${SITE_URL}${p}`
}

type PageMeta = {
  /** sem o sufixo " — Gois Group" (o template do layout acrescenta) */
  title?: string
  /** título absoluto (sem template) */
  absoluteTitle?: string
  description: string
  path: string
  type?: 'website' | 'article'
  noindex?: boolean
}

/** Metadados por página (spec §18): canonical com barra final, Open Graph, X, robots. */
export function pageMetadata({ title, absoluteTitle, description, path, type = 'website', noindex }: PageMeta): Metadata {
  const fullTitle = absoluteTitle ?? (title ? `${title} — Gois Group` : TITULO_PADRAO)
  const index = IS_PRODUCTION && !noindex
  return {
    title: absoluteTitle ? { absolute: absoluteTitle } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      locale: 'pt_BR',
      siteName: 'Gois Group',
      url: path,
      title: fullTitle,
      description,
      images: [OG_IMAGE],
    },
    twitter: { card: 'summary_large_image', title: fullTitle, description, images: [OG_IMAGE.url] },
    robots: index ? { index: true, follow: true } : { index: false, follow: !noindex && IS_PRODUCTION },
  }
}

export function organizationLd() {
  const redes = known(site.redes)?.map(r => r.url) ?? []
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Gois Group',
    url: url('/'),
    logo: url('/marca/simbolo-512.png'),
    slogan: site.tagline,
    description: site.descricao,
    ...(redes.length ? { sameAs: redes } : {}),
  }
}

export function websiteLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Gois Group',
    url: url('/'),
    inLanguage: 'pt-BR',
  }
}

export function breadcrumbLd(itens: { nome: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [{ nome: 'Início', path: '/' }, ...itens].map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.nome,
      item: url(it.path),
    })),
  }
}

export function creativeWorkLd(c: { nome: string; about: string; path: string; dateCreated?: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: c.nome,
    about: c.about,
    url: url(c.path),
    inLanguage: 'pt-BR',
    creator: { '@type': 'Organization', name: 'Gois Group', url: url('/') },
    ...(c.dateCreated ? { dateCreated: c.dateCreated } : {}),
  }
}
