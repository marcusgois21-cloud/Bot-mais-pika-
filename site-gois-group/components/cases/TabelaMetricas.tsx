import type { ReactNode } from 'react'
import styles from './TabelaMetricas.module.css'

/**
 * Tabela de dados do case (spec §14.5, §19): <caption>, <th scope>. Com `rolavel`, fica numa região
 * rolável rotulada (role="region", tabindex="0") com a primeira coluna fixa — é o que evita rolagem
 * horizontal da página no mobile. Um DOM só: no desktop a mesma região simplesmente não rola.
 * Sem hooks: serve tanto a páginas (server) quanto a MetricasBuild (client).
 */
export type LinhaTabela = { chave: string; cabecalho: ReactNode; celulas: ReactNode[] }

export function TabelaMetricas({
  caption,
  colunas,
  linhas,
  rotuloRegiao,
  larguras,
  dentro,
  className,
}: {
  caption: string
  colunas: readonly string[]
  linhas: LinhaTabela[]
  /** rótulo da região rolável; sem ele, a tabela não fica numa região (não precisa rolar) */
  rotuloRegiao?: string
  /** larguras das colunas (table-layout: fixed), para que valores que chegam depois não mudem a tabela */
  larguras?: readonly string[]
  dentro?: string
  className?: string
}) {
  const tabela = (
    <table className={`${styles.tabela} ${larguras ? styles.fixa : ''}`} data-dentro={dentro}>
      <caption className={`t-small c-3 ${styles.caption}`}>{caption}</caption>
      {larguras && (
        <colgroup>
          {larguras.map((l, i) => (
            <col key={i} style={{ width: l }} />
          ))}
        </colgroup>
      )}
      <thead>
        <tr>
          {colunas.map(c => (
            <th key={c} scope="col" className="t-small c-3">
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {linhas.map(l => (
          <tr key={l.chave}>
            <th scope="row">{l.cabecalho}</th>
            {l.celulas.map((c, i) => (
              <td key={i}>{c}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )

  if (!rotuloRegiao) return <div className={`${styles.bloco} ${className ?? ''}`}>{tabela}</div>
  return (
    <div
      className={`${styles.bloco} ${styles.regiao} ${className ?? ''}`}
      role="region"
      tabIndex={0}
      aria-label={rotuloRegiao}
    >
      {tabela}
    </div>
  )
}
