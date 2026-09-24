'use client'

import { useDentro, definirDentro } from './estado'
import styles from './Dentro.module.css'

/** Botão "Ver esta página por dentro" / "Ver só a superfície" (aria-pressed). */
export function VerPorDentroBotao({
  className,
  variante = 'link',
  'data-dentro': dentro,
}: {
  className?: string
  variante?: 'link' | 'secundario'
  'data-dentro'?: string
}) {
  const ligado = useDentro()
  return (
    <button
      type="button"
      aria-pressed={ligado}
      onClick={() => definirDentro(!ligado)}
      data-dentro={dentro}
      className={`${variante === 'link' ? styles.botaoLink : styles.botaoSecundario} ${className ?? ''}`}
    >
      <span className={styles.quadrado} aria-hidden="true" data-ligado={ligado || undefined} />
      {ligado ? 'Ver só a superfície' : 'Ver esta página por dentro'}
    </button>
  )
}
