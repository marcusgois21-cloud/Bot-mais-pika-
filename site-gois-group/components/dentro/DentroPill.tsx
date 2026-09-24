'use client'

import dynamic from 'next/dynamic'
import { useDentro, definirDentro } from './estado'
import styles from './Dentro.module.css'

// A camada só é baixada na primeira ativação (spec §15.3).
const DentroOverlay = dynamic(() => import('./DentroOverlay').then(m => m.DentroOverlay), { ssr: false })

/** Pílula fixa "Vendo por dentro" + Desligar, a região de anúncio e a camada. */
export function DentroPill() {
  const ligado = useDentro()
  return (
    <>
      <p id="anuncio-dentro" className="sr-only" aria-live="polite" />
      {ligado && (
        <>
          <DentroOverlay />
          <div className={styles.pill} role="group" aria-label="Vista por dentro">
            <span className={styles.quadradoRubrica} aria-hidden="true" />
            <span>Vendo por dentro</span>
            <button type="button" className={styles.desligar} onClick={() => definirDentro(false)}>
              Desligar
            </button>
          </div>
        </>
      )}
    </>
  )
}
