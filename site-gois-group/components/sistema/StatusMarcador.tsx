import type { Status } from '@/lib/conteudo'
import { STATUS_ROTULO } from '@/lib/conteudo'

/** Marcador de status por FORMA (spec §4.6), sempre acompanhado do texto. */
export type EstadoMarcador = Status | 'reservado'

export function StatusMarcador({ status, tamanho = 10, className }: { status: EstadoMarcador; tamanho?: number; className?: string }) {
  const cor =
    status === 'em-operacao' ? 'var(--text-1)' : status === 'reservado' ? 'var(--line-ui)' : 'var(--text-2)'
  return (
    <svg viewBox="0 0 10 10" width={tamanho} height={tamanho} style={{ color: cor }} className={className} aria-hidden="true" focusable="false" data-marcador={status}>
      {status === 'em-operacao' && <rect width="10" height="10" fill="currentColor" />}
      {status === 'em-construcao' && <rect x=".75" y=".75" width="8.5" height="8.5" fill="none" stroke="currentColor" strokeWidth="1.5" />}
      {status === 'em-evolucao' && (
        <>
          <rect x=".75" y=".75" width="8.5" height="8.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M.75 9.25V.75L9.25 9.25Z" fill="currentColor" />
        </>
      )}
      {status === 'reservado' && <rect x=".5" y=".5" width="9" height="9" fill="none" stroke="currentColor" strokeDasharray="1 2" />}
    </svg>
  )
}

export function Status({ status, className }: { status: EstadoMarcador; className?: string }) {
  return (
    <span className={`t-label ${className ?? ''}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <StatusMarcador status={status} />
      {status === 'reservado' ? 'Espaço reservado' : STATUS_ROTULO[status]}
    </span>
  )
}
