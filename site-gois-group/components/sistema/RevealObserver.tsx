'use client'

import { useLayoutEffect } from 'react'
import { usePathname } from 'next/navigation'
import { mq } from '@/lib/breakpoints'

/**
 * Um único IntersectionObserver para todas as revelações ([data-reveal="corte" | "fade" | "linha" | …]).
 *
 * - Varredura antes do primeiro quadro de cada rota (layout effect): o que já está na tela fica
 *   'imediato' (estado final, sem animação); o resto passa a ser observado. Só DEPOIS disso o <html>
 *   ganha a classe `revelar`, a única sob a qual o CSS esconde algo. Sem JS, sem o bundle ou antes da
 *   hidratação, nada fica oculto.
 * - Revela ao entrar na viewport (rootMargin 0, sem faixa morta): nada fica oculto mais que a própria
 *   animação (≤ 680 ms) depois de entrar.
 * - O foco nunca cai em conteúdo invisível: focusin revela na hora o que contém o elemento focado.
 * - No fim da página, revela o que restar (saltos por âncora ou End deixam blocos para trás).
 * - O primeiro relatório do observador vale como varredura: o que ele já encontra na tela (ex.: a
 *   posição restaurada por Voltar) também fica 'imediato'.
 * Componentes que montam conteúdo depois disparam `window.dispatchEvent(new Event('gg:reveal'))`.
 */
const PENDENTE = '[data-reveal]:not([data-revelado])'

function revelarJa(el: Element) {
  let alvo: Element | null = el.closest(PENDENTE)
  while (alvo) {
    ;(alvo as HTMLElement).dataset.revelado = 'imediato'
    alvo = alvo.parentElement?.closest(PENDENTE) ?? null
  }
}

export function RevealObserver() {
  const pathname = usePathname()

  useLayoutEffect(() => {
    const html = document.documentElement
    const reduzir = window.matchMedia(mq.menosMovimento).matches
    const primeiroRelatorio = new WeakSet<Element>()

    const io = new IntersectionObserver(entries => {
      for (const e of entries) {
        const el = e.target as HTMLElement
        const primeiro = !primeiroRelatorio.has(el)
        primeiroRelatorio.add(el)
        if (!e.isIntersecting) continue
        if (!el.hasAttribute('data-revelado')) el.dataset.revelado = primeiro ? 'imediato' : ''
        io.unobserve(el)
      }
    })

    const varrer = () => {
      const vh = window.innerHeight
      document.querySelectorAll<HTMLElement>(`${PENDENTE}:not([data-observado])`).forEach(el => {
        const r = el.getBoundingClientRect()
        if (reduzir || (r.top < vh && r.bottom > 0)) {
          el.dataset.revelado = 'imediato'
        } else {
          el.dataset.observado = ''
          io.observe(el)
        }
      })
    }

    const revelarResto = () => document.querySelectorAll<HTMLElement>(PENDENTE).forEach(el => (el.dataset.revelado = 'imediato'))

    let raf = 0
    const aoRolar = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) revelarResto()
      })
    }
    const aoFocar = (e: FocusEvent) => {
      if (e.target instanceof Element) revelarJa(e.target)
    }

    varrer()
    html.classList.add('revelar')
    window.addEventListener('gg:reveal', varrer)
    window.addEventListener('scroll', aoRolar, { passive: true })
    document.addEventListener('focusin', aoFocar)
    return () => {
      window.removeEventListener('gg:reveal', varrer)
      window.removeEventListener('scroll', aoRolar)
      document.removeEventListener('focusin', aoFocar)
      cancelAnimationFrame(raf)
      io.disconnect()
      document.querySelectorAll<HTMLElement>('[data-observado]').forEach(el => delete el.dataset.observado)
    }
  }, [pathname])

  return null
}
