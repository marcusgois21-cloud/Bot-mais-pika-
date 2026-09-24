import type { ReactNode } from 'react'
import { TransitionLink } from '@/components/layout/TransitionLink'
import { Seta } from '@/components/sistema/Icone'
import { Status } from '@/components/sistema/StatusMarcador'
import { Dado } from '@/components/sistema/DadoPendente'
import { ESCOPO_ROTULO, type Case, type MetricaCase } from '@/lib/conteudo'
import { isPending, known, type Maybe } from '@/lib/pending'
import { SHOW_PENDING } from '@/lib/env'
import { NBSP, numero } from '@/lib/formatar'
import { paginaCase, paginaCases } from '@/content/copy/cases'
import styles from './LinhaCase.module.css'

/**
 * Linha de case (spec §12.2): um <li> sem thumbnail — Nº em mono, título + empresa, estrutura + status,
 * métrica-chave com fonte e seta. A linha inteira é clicável (o link do título se estende por ela).
 * Placeholder em produção: sem link, aria-hidden, borda pontilhada + hachura, colunas em "—" (spec §12.4).
 * Placeholder em homologação: vira link para a página-modelo, com os campos entre colchetes.
 * O título leva o view-transition-name `case-{slug}` no clique: vira o H1 do case (spec §16).
 */
export function LinhaCase({
  caso,
  empresa,
  nivel = 2,
  metrica,
}: {
  caso: Case
  /** nome da empresa do case (a página resolve: Gois Group no Nº 000, a empresa relacionada nos demais) */
  empresa: Maybe<string>
  /** nível do título na página em que a linha aparece */
  nivel?: 2 | 3 | 4
  /** métrica-chave já montada (a do Nº 000 vem de /metrics.json, no cliente); sem ela, a 1ª métrica do case */
  metrica?: ReactNode
}) {
  const reservado = caso.placeholder && !SHOW_PENDING
  const modelo = caso.placeholder && SHOW_PENDING
  const Titulo = `h${nivel}` as 'h2' | 'h3' | 'h4'
  const codigo = paginaCases.codigo(caso.numero)

  if (reservado) {
    return (
      <li className={`${styles.linha} ${styles.reservado}`} aria-hidden="true" data-dentro="Espaço reservado para case">
        <p className={`t-label c-3 ${styles.numero}`}>{codigo}</p>
        <div className={styles.titulo}>
          <p className="t-title c-3">{paginaCases.reservado}</p>
          <p className="t-small c-3">—</p>
        </div>
        <p className={`t-small c-3 ${styles.estrutura}`}>—</p>
        <p className={`t-small c-3 ${styles.metrica}`}>—</p>
      </li>
    )
  }

  const status = caso.status

  return (
    <li
      className={`${styles.linha} ${modelo ? styles.reservado : ''}`}
      data-dentro="Linha de case: a linha inteira é um link"
    >
      <p className={`t-label c-2 ${styles.numero}`} aria-hidden="true">
        {codigo}
      </p>
      <div className={styles.titulo}>
        <Titulo className={`t-title ${styles.nome}`}>
          <TransitionLink href={`/cases/${caso.slug}/`} vtName={`case-${caso.slug}`} className={styles.link}>
            <span className="sr-only">{paginaCase.codigo(caso.numero)}: </span>
            <span data-vt-alvo>
              <Dado valor={caso.titulo} />
            </span>
          </TransitionLink>
        </Titulo>
        <p className="t-small c-2">
          <Dado valor={empresa} />
        </p>
      </div>
      <div className={styles.estrutura}>
        <p className="t-small">
          <Dado valor={caso.estrutura}>{v => v.map(e => ESCOPO_ROTULO[e]).join(' · ')}</Dado>
        </p>
        {isPending(status) ? (
          <p className="t-small c-3">
            <Dado valor={status} />
          </p>
        ) : (
          <Status status={status} className="c-2" />
        )}
      </div>
      <div className={styles.metrica}>{metrica ?? <MetricaChave metrica={caso.metricas[0]} />}</div>
      <span className={styles.seta} aria-hidden="true">
        <Seta />
      </span>
    </li>
  )
}

/** Primeira métrica do case, com a fonte logo abaixo. Pendente: o estado de dado pendente. */
function MetricaChave({ metrica }: { metrica?: MetricaCase }) {
  if (!metrica) return <p className="t-small c-3">—</p>
  const v = known(metrica.depois) ?? known(metrica.valor)
  const fonte = known(metrica.fonte)
  return (
    <span className={styles.chave}>
      <span className="t-small c-2">{metrica.rotulo}</span>
      <span className={`t-body ${styles.chaveValor}`}>
        {v === undefined ? (
          <Dado valor={isPending(metrica.depois) ? metrica.depois : metrica.valor} />
        ) : (
          `${numero(v, Number.isInteger(v) ? 0 : 1)}${metrica.unidade ? `${NBSP}${metrica.unidade}` : ''}`
        )}
      </span>
      {fonte ? <span className="t-micro c-3">{`${paginaCases.fonte} ${fonte}`}</span> : <Dado valor={metrica.fonte} />}
    </span>
  )
}
