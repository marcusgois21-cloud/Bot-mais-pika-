'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { cortar, resolverTransicoes, suportaTransicao } from './transicao'

declare global {
  interface Window {
    __ggNavegou?: boolean
  }
}

type Entrada = { index: number; key: string }
type NavigateEventLike = Event & {
  navigationType: string
  canIntercept: boolean
  hashChange: boolean
  downloadRequest: string | null
  destination: { url: string; index: number; key: string }
  intercept: (o: { handler: () => Promise<void>; scroll?: 'manual'; focusReset?: 'manual' }) => void
}
type NavigationLike = EventTarget & { currentEntry: Entrada | null }

/**
 * Resolve a promessa da View Transition quando a rota nova monta, marca que houve navegação cliente
 * (a Home usa intro curta) e move o foco para #conteudo (spec §16, §19).
 *
 * Voltar/avançar do navegador também cortam (da direita para a esquerda ao voltar), onde há Navigation
 * API: o evento `navigate` diz a direção e segura a restauração nativa da rolagem (scroll: 'manual'),
 * para a página antiga não saltar antes do instantâneo; o popstate do Next é adiado para dentro do
 * callback da transição, e a rolagem da entrada de destino (guardada aqui, por chave de entrada, ao sair
 * dela) volta assim que a rota nova monta, antes do quadro novo. Entrada sem posição conhecida (ex.:
 * depois de recarregar), sem Navigation API ou sem View Transitions: voltar é instantâneo e o navegador
 * restaura a rolagem sozinho, como antes.
 */
export function NavigationListener() {
  const pathname = usePathname()
  const rota = useRef(pathname)
  const primeira = useRef(true)
  const aoMontarRota = useRef<(() => void) | null>(null)
  const estadoDaRota = useRef<unknown>(null)

  // Antes do primeiro quadro da rota nova: devolve a rolagem de voltar/avançar (o RevealObserver, depois
  // deste componente na árvore, já varre a posição certa).
  useLayoutEffect(() => {
    rota.current = pathname
    const f = aoMontarRota.current
    aoMontarRota.current = null
    f?.()
  }, [pathname])

  // Âncoras nativas (pular para o conteúdo, "Voltar ao topo") criam entradas de histórico sem o estado do
  // roteador do Next, que as ignora: voltar a uma delas vindo de outra rota trocaria a URL sem trocar a
  // página. A entrada nova herda o estado da rota atual (mesma árvore); foco e rolagem continuam nativos.
  useEffect(() => {
    const aoMudarHash = () => {
      if (window.history.state !== null) return
      const estado = estadoDaRota.current
      if (estado) window.history.replaceState(estado, '', window.location.href)
    }
    window.addEventListener('hashchange', aoMudarHash)
    return () => window.removeEventListener('hashchange', aoMudarHash)
  }, [])

  useEffect(() => {
    estadoDaRota.current = window.history.state
    if (primeira.current) {
      primeira.current = false
      return
    }
    window.__ggNavegou = true
    resolverTransicoes()
    const main = document.getElementById('conteudo')
    if (main && !window.location.hash) main.focus({ preventScroll: true })
  }, [pathname])

  useEffect(() => {
    const nav = (window as Window & { navigation?: NavigationLike }).navigation
    if (!nav || !suportaTransicao()) return
    // posição de rolagem de cada entrada do histórico, gravada ao sair dela (push ou travessia)
    const posicoes = new Map<string, number>()
    let travessia: { dir: 'forward' | 'back'; y: number; concluir: () => void } | null = null
    let redespachando = false

    const aoNavegar = (ev: Event) => {
      const e = ev as NavigateEventLike
      const atual = nav.currentEntry
      if (atual && e.navigationType !== 'replace' && e.navigationType !== 'reload') posicoes.set(atual.key, window.scrollY)
      if (e.navigationType !== 'traverse' || !e.canIntercept || e.hashChange || e.downloadRequest !== null) return
      if (new URL(e.destination.url).pathname === rota.current) return
      const y = posicoes.get(e.destination.key)
      if (y === undefined) return
      travessia?.concluir()
      let concluir!: () => void
      const concluida = new Promise<void>(r => (concluir = r))
      const dir = e.destination.index < (atual?.index ?? 0) ? 'back' : 'forward'
      e.intercept({ scroll: 'manual', focusReset: 'manual', handler: () => concluida })
      travessia = { dir, y, concluir }
      // teto: a navegação interceptada nunca fica pendurada
      window.setTimeout(concluir, 3000)
    }

    const aoPopstate = (ev: PopStateEvent) => {
      if (redespachando || !travessia) return
      const t = travessia
      travessia = null
      // entrada que não é do roteador do Next (ex.: âncora nativa): nada de corte, o Next decide
      if (!(ev.state && typeof ev.state === 'object' && '__NA' in ev.state)) {
        window.scrollTo(0, t.y)
        t.concluir()
        return
      }
      ev.stopImmediatePropagation()
      const estado = ev.state
      aoMontarRota.current = () => {
        window.scrollTo(0, t.y)
        t.concluir()
      }
      cortar(t.dir, () => {
        redespachando = true
        try {
          window.dispatchEvent(new PopStateEvent('popstate', { state: estado }))
        } finally {
          redespachando = false
        }
      })
    }

    nav.addEventListener('navigate', aoNavegar)
    window.addEventListener('popstate', aoPopstate, true)
    return () => {
      nav.removeEventListener('navigate', aoNavegar)
      window.removeEventListener('popstate', aoPopstate, true)
      travessia?.concluir()
    }
  }, [])

  return null
}
