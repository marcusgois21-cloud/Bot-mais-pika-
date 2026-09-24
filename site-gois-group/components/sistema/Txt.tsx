import { SHOW_PENDING } from '@/lib/env'
import { isValidar, type Texto } from '@/lib/conteudo'

/**
 * Texto de copy que pode ser um compromisso [VALIDAR]. Aparece normalmente; em homologação ganha
 * um sublinhado pontilhado e o título "A validar pela Gois Group" para o cliente revisar.
 */
export function Txt({ t }: { t: Texto }) {
  if (!isValidar(t)) return <>{t}</>
  if (!SHOW_PENDING || t.aprovado) return <>{t.texto}</>
  return (
    <span data-validar title="A validar pela Gois Group" style={{ textDecoration: 'underline dotted var(--line-ui)', textUnderlineOffset: '0.2em' }}>
      {t.texto}
    </span>
  )
}
