'use client'

import dynamic from 'next/dynamic'
import type { MouseEvent } from 'react'
import { useDentro, definirDentro, alvoAoDesligar } from './estado'
import styles from './Dentro.module.css'

// A camada só é baixada na primeira ativação (spec §15.3).
const DentroOverlay = dynamic(() => import('./DentroOverlay').then(m => m.DentroOverlay), { ssr: false })

/** Pílula fixa "Vendo por dentro" + Desligar, a região de anúncio e a camada. */
export function DentroPill() {
  const ligado = useDentro()

  // "Desligar" some junto com a pílula: o foco vai antes para um alvo estável (estado.ts).
  // Pelo teclado, a página rola até ele; com ponteiro, a página fica onde está.
  function desligar(e: MouseEvent<HTMLButtonElement>) {
    const alvo = alvoAoDesligar()
    definirDentro(false)
    alvo?.focus({ preventScroll: e.detail > 0 || alvo.id === 'conteudo' })
  }

  return (
    <>
      <p id="anuncio-dentro" className="sr-only" aria-live="polite" />
      {ligado && (
        <>
          <DentroOverlay />
          <div className={styles.pill} role="group" aria-label="Vista por dentro">
            <span className={styles.quadradoRubrica} aria-hidden="true" />
            <span>Vendo por dentro</span>
            <button type="button" className={styles.desligar} onClick={desligar}>
              Desligar
            </button>
          </div>
        </>
      )}
    </>
  )
}
