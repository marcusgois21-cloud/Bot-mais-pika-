import { SHOW_PENDING } from '@/lib/env'
import { isPending, type Maybe, type Pending } from '@/lib/pending'
import styles from './DadoPendente.module.css'

/**
 * Estado "dado pendente" (spec §7.2).
 * Produção: texto neutro ("—", "Espaço reservado", "Fonte: a definir") — nunca um nome simulado.
 * Homologação (NEXT_PUBLIC_SHOW_PENDING=1): a instrução exata entre colchetes, em mono, pontilhado + hachura + PENDENTE.
 */
export function DadoPendente({ dado, neutro = '—', className }: { dado: Pending; neutro?: string; className?: string }) {
  if (!SHOW_PENDING) return <span className={className}>{neutro}</span>
  return (
    <span className={`${styles.pendente} ${className ?? ''}`} data-pendente>
      <span className={styles.etiqueta} aria-hidden="true">Pendente</span>
      <span className="sr-only">Dado pendente: </span>
      {dado.hint}
    </span>
  )
}

/** Renderiza o valor real, ou o estado pendente. */
export function Dado<T>({
  valor,
  neutro,
  children,
  className,
}: {
  valor: Maybe<T>
  neutro?: string
  children?: (v: T) => React.ReactNode
  className?: string
}) {
  if (isPending(valor)) return <DadoPendente dado={valor} neutro={neutro} className={className} />
  return <>{children ? children(valor) : String(valor)}</>
}
