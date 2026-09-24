'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { resolverTransicoes } from './TransitionLink'

declare global {
  interface Window {
    __ggNavegou?: boolean
  }
}

/**
 * Resolve a promessa da View Transition quando a rota nova monta, marca que houve navegação cliente
 * (a Home usa intro curta) e move o foco para #conteudo (spec §16, §19).
 */
export function NavigationListener() {
  const pathname = usePathname()
  const primeira = useRef(true)

  useEffect(() => {
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
    const voltar = () => {
      document.documentElement.dataset.vtDir = 'back'
      window.setTimeout(() => delete document.documentElement.dataset.vtDir, 400)
    }
    window.addEventListener('popstate', voltar)
    return () => window.removeEventListener('popstate', voltar)
  }, [])

  return null
}
