import type { Metadata } from 'next'
import { LinhaCase } from '@/components/cases/LinhaCase'
import { PesoDaHome } from '@/components/cases/MetricasBuild'
import { JsonLd } from '@/components/sistema/JsonLd'
import { casos, CAPITULOS } from '@/content/cases'
import { empresas } from '@/content/empresas'
import { empresaDoCase, metricasBuild, paginaCases, seoCases } from '@/content/copy/cases'
import { publicada } from '@/lib/conteudo'
import { SHOW_PENDING } from '@/lib/env'
import { breadcrumbLd, pageMetadata } from '@/lib/seo'
import styles from './cases.module.css'

export const metadata: Metadata = pageMetadata({
  title: seoCases.lista.title,
  description: seoCases.lista.description,
  path: '/cases/',
})

/** No máximo 3 linhas somando cases reais e espaços reservados (spec §7.4, §14.3). */
const TETO = 3

const copyPeso = {
  pesoDaHome: metricasBuild.pesoDaHome,
  unidadePeso: metricasBuild.unidadePeso,
  versao: metricasBuild.versao,
  falha: metricasBuild.falha,
}

const cascata = (i: number) =>
  ({ '--reveal-delay': `min(calc(var(--stagger) * ${i}), var(--stagger-max))` }) as React.CSSProperties

/**
 * /cases/ (spec §14.3, §14.4, §12.4): um registro — <ol> de linhas, sem thumbnails. O Nº 000 é real.
 * Produção: os espaços reservados completam até 3 linhas, sem link. Homologação: os placeholders
 * viram links para as páginas-modelo (noindex).
 */
export default function Cases() {
  const reais = casos.filter(publicada)
  const placeholders = casos.filter(c => c.placeholder)
  const reservados = SHOW_PENDING ? placeholders : placeholders.slice(0, Math.max(0, TETO - reais.length))
  const resumo = !SHOW_PENDING && reservados.length > 0 && paginaCases.resumoReservados(reservados.map(c => paginaCases.codigo(c.numero)))

  return (
    <>
      <JsonLd data={breadcrumbLd([{ nome: paginaCases.rotulo, path: '/cases/' }])} />

      <div className={`grid ${styles.topo}`}>
        <p className="t-eyebrow c-3 full">{paginaCases.rotulo}</p>
        <h1 className={`t-display-l ${styles.h1}`} data-dentro="Título da página">
          {paginaCases.h1}
        </h1>
        <div className={styles.vazio} data-dentro-vazio aria-hidden="true" />
        <p className={`t-lead c-2 ${styles.lead}`} data-dentro="Texto de apoio">
          {paginaCases.lead}
        </p>

        <section className={styles.registroBloco} aria-label={paginaCases.rotuloRegistro}>
          <div className={styles.cabecalho} aria-hidden="true">
            <span>{paginaCases.colunas.numero}</span>
            <span>{paginaCases.colunas.caso}</span>
            <span>{paginaCases.colunas.estrutura}</span>
            <span>{paginaCases.colunas.metrica}</span>
          </div>
          <ol className={styles.registro} data-dentro="Registro de cases, em ordem">
            {reais.map(c => (
              <LinhaCase
                key={c.slug}
                caso={c}
                empresa={empresaDoCase(c, empresas)}
                nivel={2}
                metrica={c.metricasDoBuild ? <PesoDaHome copy={copyPeso} /> : undefined}
              />
            ))}
            {reservados.map(c => (
              <LinhaCase key={c.slug} caso={c} empresa={empresaDoCase(c, empresas)} nivel={2} />
            ))}
            {resumo && <li className="sr-only">{resumo}</li>}
          </ol>
        </section>
      </div>

      <section className="secao" aria-labelledby="todo-case-titulo">
        <div className={`grid ${styles.todo}`}>
          <h2 id="todo-case-titulo" className={`t-display-m ${styles.todoTitulo}`} data-reveal="corte" data-dentro="Título do bloco">
            {paginaCases.todoCase.titulo}
          </h2>
          <ol className={styles.todoLista} data-dentro="Os sete capítulos de todo case">
            {CAPITULOS.map((c, i) => (
              <li key={c.chave} className={styles.todoItem} data-reveal="fade" style={cascata(i)}>
                <span className={`t-lead c-3 ${styles.todoNum}`} aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p className="t-lead c-2">
                  <span className="c-1">{c.titulo}</span> — {c.resumo}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  )
}
