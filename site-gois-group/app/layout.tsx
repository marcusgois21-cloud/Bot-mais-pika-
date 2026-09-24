import type { Metadata, Viewport } from 'next'
import { archivo, martian } from './fonts'
import { Header } from '@/components/layout/Header'
import { Lockup } from '@/components/marca/Lockup'
import { Footer } from '@/components/layout/Footer'
import { SkipLink } from '@/components/layout/SkipLink'
import { NavigationListener } from '@/components/layout/NavigationListener'
import { RevealObserver } from '@/components/sistema/RevealObserver'
import { DentroPill } from '@/components/dentro/DentroPill'
import { JsonLd } from '@/components/sistema/JsonLd'
import { SITE_URL, IS_PRODUCTION } from '@/lib/env'
import { OG_IMAGE, TITULO_PADRAO, organizationLd, websiteLd } from '@/lib/seo'
import { site, NAV } from '@/content/site'
import { known } from '@/lib/pending'

import '@/styles/tokens.css'
import '@/styles/base.css'
import '@/styles/tipografia.css'
import '@/styles/grid.css'
import '@/styles/motion.css'
import '@/styles/utilitarios.css'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { template: '%s — Gois Group', default: TITULO_PADRAO },
  description: site.descricao,
  applicationName: 'Gois Group',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Gois Group',
    url: '/',
    title: TITULO_PADRAO,
    description: site.descricao,
    images: [OG_IMAGE],
  },
  twitter: { card: 'summary_large_image', title: TITULO_PADRAO, description: site.descricao, images: [OG_IMAGE.url] },
  robots: IS_PRODUCTION ? { index: true, follow: true } : { index: false, follow: false },
  formatDetection: { telephone: false, email: false, address: false },
}

export const viewport: Viewport = {
  themeColor: '#0B0B0A',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
}

/**
 * Antes do primeiro paint (spec §21.4): marca html.js, decide a intro da Home (completa na primeira
 * visita da sessão, curta nas seguintes) e reaplica "Ver por dentro". São as duas únicas chaves de
 * armazenamento do site — sessionStorage, com try/catch. Nada de localStorage, cookies ou rastreadores.
 */
const SCRIPT_HEAD = `(function(){var d=document.documentElement;d.classList.add('js');try{var s=sessionStorage;d.dataset.intro=s.getItem('gg:intro')?'curta':'completa';s.setItem('gg:intro','1');if(s.getItem('gg:dentro')==='1')d.dataset.dentro='on'}catch(e){d.dataset.intro='curta'}})();`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const email = known(site.email)
  return (
    <html lang="pt-BR" className={`${archivo.variable} ${martian.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_HEAD }} />
        <JsonLd data={[organizationLd(), websiteLd()]} />
      </head>
      <body>
        <SkipLink />
        {/* O lockup é desenhado aqui, no servidor: o Header é cliente e não carrega o path do wordmark. */}
        <Header marca={<Lockup altura={12} />} nav={NAV} email={email} />
        <main id="conteudo" tabIndex={-1}>
          {children}
        </main>
        <Footer />
        <DentroPill />
        <NavigationListener />
        <RevealObserver />
      </body>
    </html>
  )
}
