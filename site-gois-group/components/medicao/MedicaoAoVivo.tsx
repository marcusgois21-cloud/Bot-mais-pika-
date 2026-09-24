'use client'

import { useEffect, useState } from 'react'
import type { ChaveMedicao, CopyMedicao } from '@/content/copy/cases'
import { contagem, numero, NBSP } from '@/lib/formatar'
import styles from './MedicaoAoVivo.module.css'

/**
 * "Este site, medido agora" (spec §13.3). Mede no navegador de quem visita, pela API de Performance:
 * começa em requestIdleCallback (sem ele, 1 s depois), detecta cada medida pelo recurso
 * (PerformanceObserver.supportedEntryTypes), nunca pelo nome do navegador, e mostra o número como veio —
 * sem esconder, filtrar ou arredondar para melhor. As células reservam a altura: chegar um valor não
 * desloca nada (zero CLS). A copy chega por props: o texto fica no HTML, fora do JavaScript.
 */
type Leitura = { n: string; u?: string } | { t: string }
type Deslocamento = PerformanceEntry & { value: number; hadRecentInput: boolean }
type Evento = PerformanceEntry & { interactionId?: number }

/** Sem interactionId (navegadores antigos), só eventos discretos contam como toque, clique ou tecla. */
const DISCRETOS = /^(pointerdown|pointerup|mousedown|mouseup|click|keydown|keyup)$/

export function MedicaoAoVivo({ copy: medicao }: { copy: CopyMedicao }) {
  const [leituras, setLeituras] = useState<Partial<Record<ChaveMedicao, Leitura>>>({})
  const [outraPagina, setOutraPagina] = useState(false)

  useEffect(() => {
    const observadores: PerformanceObserver[] = []
    let encerrado = false
    const ler = (chave: ChaveMedicao, l: Leitura) => {
      if (!encerrado) setLeituras(atual => ({ ...atual, [chave]: l }))
    }

    const iniciar = () => {
      if (encerrado) return
      const tipos: readonly string[] =
        (typeof PerformanceObserver === 'function' && PerformanceObserver.supportedEntryTypes) || []
      const observar = (type: string, cb: (lista: PerformanceEntryList) => void, extra?: object) => {
        if (!tipos.includes(type)) return false
        try {
          const o = new PerformanceObserver(lista => cb(lista.getEntries()))
          o.observe({ type, buffered: true, ...extra } as PerformanceObserverInit)
          observadores.push(o)
          return true
        } catch {
          return false
        }
      }

      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
      try {
        setOutraPagina(Boolean(nav) && new URL(nav!.name).pathname !== window.location.pathname)
      } catch {
        /* URL inválida: trata como a mesma página */
      }

      // Transferido (transferSize da navegação + recursos) e arquivos (recursos + o documento).
      const mede = typeof nav?.transferSize === 'number'
      let bytes = mede ? nav!.transferSize : 0
      let arquivos = 1
      const recursos = (lista: PerformanceEntryList) => {
        for (const e of lista) {
          arquivos++
          bytes += (e as PerformanceResourceTiming).transferSize || 0
        }
        ler('arquivos', { n: contagem(arquivos) })
        ler(
          'transferido',
          !mede ? { t: medicao.semSuporte } : bytes > 0 ? { n: numero(bytes / 1024, 1), u: 'KB' } : { t: medicao.emCache },
        )
      }
      recursos([])
      if (!observar('resource', recursos)) recursos(performance.getEntriesByType('resource'))

      // Conteúdo principal visível: último candidato a LCP.
      const lcp = observar('largest-contentful-paint', lista => {
        const ultimo = lista[lista.length - 1]
        if (ultimo) ler('lcp', { n: numero(ultimo.startTime / 1000, 2), u: 's' })
      })
      if (!lcp) ler('lcp', { t: medicao.semSuporte })

      // Quanto a página se mexeu: soma dos deslocamentos sem input recente.
      let cls = 0
      const ls = observar('layout-shift', lista => {
        for (const e of lista as Deslocamento[]) if (!e.hadRecentInput) cls += e.value
        ler('cls', { n: numero(cls, 3) })
      })
      ler('cls', ls ? { n: numero(cls, 3) } : { t: medicao.semSuporte })

      // Resposta mais lenta: máximo das interações (Event Timing, limiar de 40 ms) e da primeira entrada.
      let maior = 0
      const registrar = (duracao: number) => {
        if (duracao <= maior) return
        maior = duracao
        ler('inp', { n: contagem(Math.round(maior)), u: 'ms' })
      }
      if (tipos.includes('event')) {
        ler('inp', { t: medicao.interaja })
        observar(
          'event',
          lista => {
            for (const e of lista as Evento[]) {
              const id = e.interactionId
              if (id === 0 || (id === undefined && !DISCRETOS.test(e.name))) continue
              registrar(e.duration)
            }
          },
          { durationThreshold: 40 },
        )
        observar('first-input', lista => lista.forEach(e => registrar(e.duration)))
      } else {
        ler('inp', { t: medicao.semSuporte })
      }
    }

    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number
      cancelIdleCallback?: (id: number) => void
    }
    const ocioso = typeof w.requestIdleCallback === 'function'
    const id = ocioso ? w.requestIdleCallback!(iniciar, { timeout: 3000 }) : window.setTimeout(iniciar, 1000)

    return () => {
      encerrado = true
      if (ocioso) w.cancelIdleCallback?.(id)
      else window.clearTimeout(id)
      observadores.forEach(o => o.disconnect())
    }
  }, [medicao])

  return (
    <dl className={styles.grade} data-dentro="Medições feitas no seu navegador">
      {medicao.celulas.map(c => {
        const l = leituras[c.chave]
        const nota = outraPagina && (c.chave === 'lcp' || c.chave === 'cls')
        return (
          <div key={c.chave} className={styles.celula}>
            <dt className={styles.termo}>
              <span className={`t-small ${styles.rotulo}`}>{c.rotulo}</span>
              <span className={`t-micro c-3 ${styles.tecnica}`}>
                {c.tecnica}
                {nota && ` · ${medicao.daPrimeiraPagina}`}
              </span>
            </dt>
            <dd className={styles.valor}>
              <span className={styles.caixa}>
                <Valor leitura={l} semLeitura={medicao.semLeitura} />
              </span>
            </dd>
            {c.referencia && <dd className={`t-small c-3 ${styles.referencia}`}>{c.referencia}</dd>}
          </div>
        )
      })}
    </dl>
  )
}

/** Valor medido (numeral + unidade em mono) ou estado em texto. Muda de forma: entra com fade de 160 ms. */
function Valor({ leitura, semLeitura }: { leitura?: Leitura; semLeitura: string }) {
  if (!leitura) return <span className={`${styles.numero} c-3`}>{semLeitura}</span>
  if ('t' in leitura) {
    return (
      <span key="t" className={`t-small c-2 ${styles.texto} ${styles.chega}`}>
        {leitura.t}
      </span>
    )
  }
  return (
    <span key="n" className={`${styles.numero} ${styles.chega}`}>
      {leitura.n}
      {leitura.u && (
        <>
          {NBSP}
          <span className={`t-label ${styles.unidade}`}>{leitura.u}</span>
        </>
      )}
    </span>
  )
}
