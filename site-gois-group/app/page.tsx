import type { Metadata } from 'next'
import { Hero } from '@/components/hero/Hero'
import { QuemE } from '@/components/secoes/QuemE'
import { OQueConstruimos } from '@/components/secoes/OQueConstruimos'
import { Metodo } from '@/components/secoes/Metodo'
import { Ecossistema } from '@/components/secoes/Ecossistema'
import { Capacidade } from '@/components/secoes/Capacidade'
import { Visao } from '@/components/secoes/Visao'
import { PorQue } from '@/components/secoes/PorQue'
import { ProximoPasso } from '@/components/secoes/ProximoPasso'
import { pageMetadata, TITULO_PADRAO } from '@/lib/seo'
import { site } from '@/content/site'

export const metadata: Metadata = pageMetadata({ absoluteTitle: TITULO_PADRAO, description: site.descricao, path: '/' })

/**
 * Home — a narrativa na ordem do brief (spec §8):
 * quem é → o que construímos → como construímos → ecossistema → capacidade → visão → por que → próximo passo.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <QuemE />
      <OQueConstruimos />
      <Metodo />
      <Ecossistema />
      <Capacidade />
      <Visao />
      <PorQue />
      <ProximoPasso />
    </>
  )
}
