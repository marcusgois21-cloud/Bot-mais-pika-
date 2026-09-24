'use client'

import { useEffect, useLayoutEffect, useState } from 'react'
import styles from './CapitulosCase.module.css'

/**
 * Índice dos 7 capítulos do case (spec §14.5). Desktop: coluna fixa (sticky) sob o header, com o
 * capítulo atual marcado por um traço giz de 12 px — é posição, não seleção, por isso não é Rubrica.
 * Mobile: a mesma lista, no topo, sem nada fixo. IntersectionObserver, sem listener de scroll.
 * A copy chega por props (content/copy/cases.ts fica no servidor, fora do JavaScript da página).
 */
export type ItemCapitulo = { id: string; numero: string; titulo: string }

export function CapitulosCase({ itens, rotulo, aria }: { itens: ItemCapitulo[]; rotulo: string; aria: string }) {
  const [atual, setAtual] = useState<string | null>(null)

  useEffect(() => {
    const secoes = itens.map(i => document.getElementById(i.id)).filter((s): s is HTMLElement => Boolean(s))
    if (!secoes.length) return
    // O atual é o último capítulo cujo título já passou da linha de leitura (35% da janela); acima do
    // primeiro, nenhum. Os observadores só avisam quando algo muda: um título cruza a linha, ou um
    // capítulo entra ou sai da tela (saltos longos, como voltar ao topo).
    const titulos = secoes.map(s => s.querySelector('h2') ?? s)
    const calcular = () => {
      const linha = window.innerHeight * 0.35
      let id: string | null = null
      titulos.forEach((t, n) => {
        if (t.getBoundingClientRect().top <= linha) id = secoes[n].id
      })
      setAtual(id)
    }
    const naLinha = new IntersectionObserver(calcular, { rootMargin: '0px 0px -65% 0px' })
    const naTela = new IntersectionObserver(calcular)
    titulos.forEach(t => naLinha.observe(t))
    secoes.forEach(s => naTela.observe(s))
    return () => {
      naLinha.disconnect()
      naTela.disconnect()
    }
  }, [itens])

  return (
    <nav className={styles.indice} aria-label={aria} data-dentro="Índice dos capítulos">
      <p className={`t-small c-3 ${styles.rotulo}`} aria-hidden="true">
        {rotulo}
      </p>
      <ol className={styles.lista}>
        {itens.map(i => (
          <li key={i.id}>
            <a href={`#${i.id}`} className={styles.item} aria-current={atual === i.id ? 'location' : undefined}>
              <span className={styles.traco} aria-hidden="true" />
              <span className={styles.num}>{i.numero}</span>{' '}
              <span className={styles.titulo}>{i.titulo}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}

/**
 * Continuidade da linha para o H1 (spec §16). Ao clicar numa linha de case, o TransitionLink dá ao título da
 * linha o view-transition-name `case-{slug}`. Enquanto a página nova renderiza, a página antiga ainda
 * está no documento: se a linha nomeada existe, o H1 assume o mesmo nome só durante a transição e o
 * perde em seguida — nunca há dois elementos com o mesmo nome. Vindo de qualquer outro link, nada muda.
 */
export function ContinuidadeTitulo({ slug, alvo }: { slug: string; alvo: string }) {
  const nome = `case-${slug}`
  const [veioDaLinha] = useState(
    () =>
      typeof document !== 'undefined' &&
      Array.from(document.querySelectorAll<HTMLElement>('[data-vt-alvo]')).some(
        el => el.style.viewTransitionName === nome,
      ),
  )

  useLayoutEffect(() => {
    const h1 = document.getElementById(alvo)
    if (!veioDaLinha || !h1 || !document.documentElement.dataset.vtDir) return
    h1.style.viewTransitionName = nome
    const t = window.setTimeout(() => {
      h1.style.viewTransitionName = ''
    }, 500)
    return () => window.clearTimeout(t)
  }, [veioDaLinha, alvo, nome])

  return null
}
