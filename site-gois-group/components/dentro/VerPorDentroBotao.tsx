'use client'

import { useDentro, definirDentro } from './estado'
import styles from './Dentro.module.css'

/**
 * Botão "Ver esta página por dentro" / "Ver só a superfície". O rótulo diz a ação e muda com o estado,
 * por isso não usa aria-pressed (nome e estado não podem se contradizer: "Ver só a superfície, pressionado").
 * O quadrado preenchido mostra o estado; o anúncio "Vista por dentro ligada." confirma a troca.
 */
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
      onClick={e => definirDentro(!ligado, e.currentTarget)}
      data-dentro={dentro}
      data-ver-por-dentro=""
      className={`${variante === 'link' ? styles.botaoLink : styles.botaoSecundario} ${className ?? ''}`}
    >
      <span className={styles.quadrado} aria-hidden="true" data-ligado={ligado || undefined} />
      {ligado ? 'Ver só a superfície' : 'Ver esta página por dentro'}
    </button>
  )
}
