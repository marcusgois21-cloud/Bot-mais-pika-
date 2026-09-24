'use client'

import { useState } from 'react'
import styles from './CopiarEmail.module.css'

/** E-mail visível + botão Copiar → Copiado por 1,2 s, anunciado por aria-live. Só renderiza com e-mail real. */
export function CopiarEmail({ email, className }: { email: string; className?: string }) {
  const [copiado, setCopiado] = useState(false)
  async function copiar() {
    try {
      await navigator.clipboard.writeText(email)
      setCopiado(true)
      window.setTimeout(() => setCopiado(false), 1200)
    } catch {
      window.location.href = `mailto:${email}`
    }
  }
  return (
    <span className={`${styles.email} ${className ?? ''}`}>
      <a href={`mailto:${email}`} className="link link--quieto">
        {email}
      </a>
      <button type="button" className={styles.copiar} onClick={copiar}>
        {copiado ? 'Copiado' : 'Copiar'}
      </button>
      <span className="sr-only" aria-live="polite">
        {copiado ? 'E-mail copiado.' : ''}
      </span>
    </span>
  )
}
