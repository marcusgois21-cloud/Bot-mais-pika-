'use client'

import { useEffect, useState } from 'react'
import { TransitionLink } from '@/components/layout/TransitionLink'
import { Seta } from '@/components/sistema/Icone'
import type { ChaveBuild, CopyMetricasBuild } from '@/content/copy/cases'
import { contagem, dataCurta, numero, NBSP } from '@/lib/formatar'
import { TabelaMetricas, type LinhaTabela } from './TabelaMetricas'
import styles from './MetricasBuild.module.css'

/**
 * Métricas de build do Case Nº 000 (spec §13.4). Os números vêm de /metrics.json, gravado por
 * scripts/measure-build.mjs a cada build — nenhum deles está escrito no código da página.
 * As células ficam reservadas enquanto o arquivo chega (zero CLS). Sem JavaScript: a tabela
 * mostra "—" e o link para o JSON. Se o arquivo faltar: "Medições indisponíveis nesta versão."
 * A copy chega por props (content/copy/cases.ts fica no servidor, fora do JavaScript da página).
 */
type Metricas = {
  build: { hash: string; data: string }
  home: Record<'htmlKB' | 'cssKB' | 'jsKB' | 'fontesKB' | 'totalKB' | 'requisicoes', number>
}
type Estado = { fase: 'carregando' } | { fase: 'ok'; m: Metricas } | { fase: 'falha' }

const URL_METRICAS = '/metrics.json'
let pedido: Promise<Metricas> | null = null

function conferir(j: unknown): Metricas {
  const m = j as Metricas
  const numeros = m?.home && Object.values(m.home)
  const ok =
    typeof m?.build?.hash === 'string' &&
    !Number.isNaN(Date.parse(m?.build?.data)) &&
    Array.isArray(numeros) &&
    (['htmlKB', 'cssKB', 'jsKB', 'fontesKB', 'totalKB', 'requisicoes'] as const).every(k => Number.isFinite(m.home[k]))
  if (!ok) throw new Error('metrics.json fora do formato')
  return m
}

/** Um pedido por página, compartilhado pela tabela e pela linha do registro; nova tentativa se falhar. */
function buscar() {
  pedido ??= fetch(URL_METRICAS, { cache: 'no-cache' })
    .then(r => {
      if (!r.ok) throw new Error(`metrics.json: ${r.status}`)
      return r.json()
    })
    .then(conferir)
    .catch(erro => {
      pedido = null
      throw erro
    })
  return pedido
}

function useMetricas(): Estado {
  const [estado, setEstado] = useState<Estado>({ fase: 'carregando' })
  useEffect(() => {
    let vivo = true
    buscar().then(
      m => vivo && setEstado({ fase: 'ok', m }),
      () => vivo && setEstado({ fase: 'falha' }),
    )
    return () => {
      vivo = false
    }
  }, [])
  return estado
}

function valor(chave: ChaveBuild, m: Metricas, unidade: string) {
  const v = m.home[chave]
  return chave === 'requisicoes' ? contagem(v) : `${numero(v, 1)}${NBSP}${unidade}`
}

const VAZIO = <span className="c-3">—</span>

/** Tabela Métrica · Valor · Versão · Data · Fonte · Método, a linha de fonte e os links. */
export function MetricasBuild({
  copy,
  caption,
  rotuloRegiao,
}: {
  copy: CopyMetricasBuild
  caption: string
  rotuloRegiao: string
}) {
  const estado = useMetricas()
  const m = estado.fase === 'ok' ? estado.m : null
  // quebra permitida só depois da barra: "scripts/" + "measure-build.mjs"
  const [pasta, arquivo] = copy.fonte.split('/')

  const linhas: LinhaTabela[] = copy.linhas.map(l => ({
    chave: l.chave,
    cabecalho: (
      <span className={styles.metrica}>
        <span className={`t-body ${styles.rotulo}`}>{l.rotulo}</span>
        <span className="t-small c-2">{l.traducao}</span>
      </span>
    ),
    celulas: [
      <span key="v" className={`t-body ${styles.valor}`}>{m ? valor(l.chave, m, copy.unidadePeso) : VAZIO}</span>,
      <span key="h" className={`t-label ${styles.codigo} ${styles.celula}`}>{m ? m.build.hash : VAZIO}</span>,
      <span key="d" className={`t-small ${styles.nowrap}`}>{m ? dataCurta(m.build.data) : VAZIO}</span>,
      <span key="f" className={`t-micro c-2 ${styles.codigo} ${styles.celula}`}>
        {pasta}/
        <wbr />
        <span className={styles.nowrap}>{arquivo}</span>
      </span>,
      <span key="me" className="t-small c-2">
        {l.chave === 'requisicoes' ? copy.metodoContagem : copy.metodoPeso}
      </span>,
    ],
  }))

  return (
    <div className={styles.bloco} aria-busy={estado.fase === 'carregando'}>
      <TabelaMetricas
        caption={caption}
        colunas={copy.colunas}
        linhas={linhas}
        rotuloRegiao={rotuloRegiao}
        larguras={['24%', '12%', '10%', '13%', '20%', '21%']}
        dentro="Tabela de medições geradas a cada versão"
      />

      <p className={styles.fonte}>
        {estado.fase === 'falha' ? (
          <span className="t-small c-2">{copy.falha}</span>
        ) : (
          <span className="t-label c-3">
            {copy.linhaFonte.fonte}
            {m && (
              <>
                {' · '}
                {copy.linhaFonte.versao} <span className={styles.codigo}>{m.build.hash}</span>
                {' · '}
                {dataCurta(m.build.data)}
              </>
            )}
            {' · '}
            {copy.linhaFonte.metodo}
          </span>
        )}
      </p>

      <p className={styles.links}>
        <TransitionLink href="/#por-que" className="link t-body" data-dentro="Link para as medições desta visita">
          {copy.linkVisita}
          <Seta />
        </TransitionLink>
        {estado.fase !== 'falha' && (
          <a href={URL_METRICAS} className="link link--quieto t-small c-2">
            {copy.linkJson}
            <Seta />
          </a>
        )}
      </p>
    </div>
  )
}

/** Métrica-chave da linha do Nº 000 no registro (spec §14.3): peso da página inicial e a versão medida. */
export function PesoDaHome({
  copy,
}: {
  copy: Pick<CopyMetricasBuild, 'pesoDaHome' | 'unidadePeso' | 'versao' | 'falha'>
}) {
  const estado = useMetricas()
  const m = estado.fase === 'ok' ? estado.m : null
  return (
    <span className={styles.peso}>
      <span className="t-small c-2">{copy.pesoDaHome}</span>
      <span className={`t-body ${styles.pesoValor}`}>
        {m ? `${numero(m.home.totalKB, 1)}${NBSP}${copy.unidadePeso}` : <span className="c-3">—</span>}
      </span>
      <span className="t-micro c-3">
        {m ? (
          <>
            {copy.versao} <span className={styles.codigo}>{m.build.hash}</span>
          </>
        ) : (
          NBSP
        )}
      </span>
      {estado.fase === 'falha' && <span className="sr-only">{copy.falha}</span>}
    </span>
  )
}
