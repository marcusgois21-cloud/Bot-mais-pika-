import { empresas } from '@/content/empresas'
import { visivel } from '@/lib/conteudo'

/** STUB — detalhe de empresa (spec §14.2). Implementação: agente "ecossistema". */
export const dynamicParams = false

export function generateStaticParams() {
  const lista = empresas.filter(visivel)
  // export estático exige ao menos um parâmetro; sem empresas visíveis a rota gera só um 404 interno
  return lista.length ? lista.map(e => ({ slug: e.slug })) : [{ slug: '_' }]
}

export default async function Pagina({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return (
    <div className="grid" style={{ paddingTop: 'calc(var(--header-h) + 96px)', paddingBottom: 96 }}>
      <h1 className="t-display-l full">{slug}</h1>
    </div>
  )
}
