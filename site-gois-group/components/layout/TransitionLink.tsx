'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ComponentProps, MouseEvent } from 'react'
import { cortar, suportaTransicao } from './transicao'

/**
 * Link interno com transição de página por View Transitions API (spec §16).
 * A página nova entra por corte sobre a antiga. Teto da promessa: 300 ms. Sem suporte: navegação instantânea.
 * Link para a própria página não anima nem congela: vai ao topo (ou à âncora, se houver).
 * `vtName` aplica um view-transition-name só ao elemento clicado, durante a transição (continuidade
 * nome → H1), e remove depois — nunca há duplicata.
 */
type Props = ComponentProps<typeof Link> & { vtName?: string }

export function TransitionLink({ href, onClick, vtName, ...rest }: Props) {
  const router = useRouter()

  function aoClicar(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.(e)
    if (e.defaultPrevented) return
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const destino = typeof href === 'string' ? href : href.pathname ?? ''
    if (!destino || /^(https?:|mailto:|tel:)/.test(destino) || destino.startsWith('#')) return
    if (rest.target && rest.target !== '_self') return

    const alvo = new URL(destino, window.location.href)
    if (alvo.origin !== window.location.origin) return
    if (alvo.pathname === window.location.pathname) {
      // mesma página: com âncora, o Link rola até ela; sem âncora, só volta ao topo — nem corte, nem
      // navegação (a query aqui só pré-preenche, ex.: ?origem= no /contato/, e não deve ser sobrescrita)
      if (alvo.hash) return
      e.preventDefault()
      window.scrollTo(0, 0)
      // um quadro depois: se o clique veio do menu, o inert já saiu de #conteudo
      requestAnimationFrame(() => document.getElementById('conteudo')?.focus({ preventScroll: true }))
      return
    }
    if (!suportaTransicao()) return

    e.preventDefault()
    const el = e.currentTarget
    const nomeado = vtName ? (el.querySelector<HTMLElement>('[data-vt-alvo]') ?? el) : null
    if (nomeado && vtName) nomeado.style.viewTransitionName = vtName
    cortar('forward', () => router.push(destino))?.finally(() => {
      if (nomeado) nomeado.style.viewTransitionName = ''
    })
  }

  return <Link href={href} onClick={aoClicar} {...rest} />
}
