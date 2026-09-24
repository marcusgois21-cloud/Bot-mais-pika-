'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ComponentProps, MouseEvent } from 'react'

/**
 * Link interno com transição de página por View Transitions API (spec §16).
 * A página nova entra por corte sobre a antiga. Teto da promessa: 300 ms. Sem suporte: navegação instantânea.
 * `vtName` aplica um view-transition-name só ao elemento clicado, durante a transição (continuidade
 * nome → H1), e remove depois — nunca há duplicata.
 */
type Props = ComponentProps<typeof Link> & { vtName?: string }

let pendentes: Array<() => void> = []
export function resolverTransicoes() {
  const r = pendentes
  pendentes = []
  r.forEach(fn => fn())
}

export function TransitionLink({ href, onClick, vtName, ...rest }: Props) {
  const router = useRouter()

  function aoClicar(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.(e)
    if (e.defaultPrevented) return
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const destino = typeof href === 'string' ? href : href.pathname ?? ''
    if (!destino || /^(https?:|mailto:|tel:)/.test(destino) || destino.startsWith('#')) return
    if (rest.target && rest.target !== '_self') return
    const doc = document as Document & { startViewTransition?: (cb: () => Promise<void>) => unknown }
    if (typeof doc.startViewTransition !== 'function') return

    // mesma rota com âncora: deixa o navegador rolar
    const alvo = new URL(destino, window.location.href)
    if (alvo.pathname === window.location.pathname && alvo.hash) return

    e.preventDefault()
    const el = e.currentTarget
    const nomeado = vtName ? (el.querySelector<HTMLElement>('[data-vt-alvo]') ?? el) : null
    if (nomeado && vtName) nomeado.style.viewTransitionName = vtName
    document.documentElement.dataset.vtDir = 'forward'

    const transicao = doc.startViewTransition(
      () =>
        new Promise<void>(resolve => {
          pendentes.push(resolve)
          router.push(destino)
          window.setTimeout(resolve, 300)
        }),
    ) as { finished?: Promise<void> } | undefined
    transicao?.finished?.finally(() => {
      if (nomeado) nomeado.style.viewTransitionName = ''
      delete document.documentElement.dataset.vtDir
    })
  }

  return <Link href={href} onClick={aoClicar} {...rest} />
}
