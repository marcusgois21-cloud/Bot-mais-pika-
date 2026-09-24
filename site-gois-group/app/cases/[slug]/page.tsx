import { casos } from '@/content/cases'
import { visivel } from '@/lib/conteudo'

/** STUB — detalhe de case (spec §14.5). Implementação: agente "cases-prova". */
export const dynamicParams = false

export function generateStaticParams() {
  return casos.filter(visivel).map(c => ({ slug: c.slug }))
}

export default async function Pagina({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return (
    <div className="grid" style={{ paddingTop: 'calc(var(--header-h) + 96px)', paddingBottom: 96 }}>
      <h1 className="t-display-l full">{slug}</h1>
    </div>
  )
}
