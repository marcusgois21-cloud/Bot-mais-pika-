import type { Medida } from '@/lib/conteudo'
import { isPending, known } from '@/lib/pending'
import { contagem, numero, NBSP } from '@/lib/formatar'
import { SHOW_PENDING } from '@/lib/env'
import styles from './Numero.module.css'

/**
 * Número com fonte, ou nenhum número (spec §13.2).
 * Confirmado: numeral tabular + unidade em mono, rótulo, definição e linha FONTE · PERÍODO · VERIFICADO.
 * Pendente: quadro pontilhado de largura fixa (não sugere ordem de grandeza) com "—".
 * Derivado igual a zero: mesmo quadro, "SEM EMPRESAS PUBLICADAS". Sem contagem animada, sem "+".
 */
function mesAno(v: string) {
  const m = v.match(/^(\d{4})-(\d{2})$/)
  return m ? `${m[2]}.${m[1]}` : v
}

export function Numero({ medida, className }: { medida: Medida; className?: string }) {
  const valor = medida.valor
  const pendente = isPending(valor)
  const derivadoZero = !pendente && medida.calculo === 'derivado' && valor === 0
  const vazio = pendente || derivadoZero

  const etiqueta = pendente ? 'Pendente' : derivadoZero ? 'Sem empresas publicadas' : null
  const leitura = pendente
    ? `${medida.rotulo}: dado pendente. Definição: ${medida.definicao}`
    : derivadoZero
      ? `${medida.rotulo}: zero — sem empresas publicadas. Definição: ${medida.definicao}`
      : undefined

  const fonte = known(medida.fonte)
  const periodo = known(medida.periodo)
  const verificado = known(medida.verificadoEm)

  let linhaFonte: string
  if (pendente) linhaFonte = 'Fonte: a definir · Período: a definir'
  else if (medida.calculo === 'derivado') linhaFonte = 'Calculado a partir das empresas publicadas neste site.'
  else linhaFonte = `Fonte: ${fonte ?? 'a definir'} · Período: ${periodo ?? 'a definir'}${verificado ? ` · Verificado em ${mesAno(verificado)}` : ''}`

  return (
    <div className={`${styles.numero} ${className ?? ''}`} data-dentro={vazio ? 'Número pendente: campo aberto, à vista' : 'Número com fonte'}>
      {leitura && <p className="sr-only">{leitura}</p>}
      <div aria-hidden={vazio || undefined}>
        <p className={`t-label c-3 ${styles.etiqueta}`}>{etiqueta ?? NBSP}</p>
        {vazio ? (
          <span className={`t-numeral ${styles.quadro}`} data-decorativo>
            <span className={styles.traco}>—</span>
          </span>
        ) : (
          <p className={`t-numeral ${styles.valor}`} data-reveal="corte">
            {Number.isInteger(valor) ? contagem(valor as number) : numero(valor as number, 1)}
            {medida.unidade && <span className={`t-label ${styles.unidade}`}>{medida.unidade}</span>}
          </p>
        )}
      </div>
      <p className={`t-title ${styles.rotulo}`} aria-hidden={vazio || undefined}>{medida.rotulo}</p>
      <p className={`t-small c-2 ${styles.definicao}`} aria-hidden={vazio || undefined}>{medida.definicao}</p>
      <p className={`${medida.calculo === 'derivado' && !pendente ? 't-small' : 't-label'} c-3 ${styles.fonte}`}>
        {linhaFonte}
        {pendente && SHOW_PENDING && <span className={styles.instrucao}> {(valor as { hint: string }).hint}</span>}
      </p>
    </div>
  )
}
