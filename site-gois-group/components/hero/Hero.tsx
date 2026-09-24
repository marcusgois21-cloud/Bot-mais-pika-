/** STUB — hero (spec §6). Implementação: agente "hero". O H1 é sólido e visível em t=0 (LCP). */
export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-titulo">
      <div className="grid" style={{ paddingTop: 'calc(var(--header-h) + 96px)', paddingBottom: 64 }}>
        <p className="t-eyebrow c-2 full">Gois Group — desenvolvimento de sites, plataformas e sistemas web</p>
        <h1 id="hero-titulo" className="t-hero full">Construímos sites de dentro para fora.</h1>
      </div>
    </section>
  )
}
