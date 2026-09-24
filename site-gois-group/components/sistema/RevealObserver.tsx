'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { mq } from '@/lib/breakpoints'

/**
 * Um único IntersectionObserver para todas as revelações ([data-reveal="corte" | "fade" | "linha"]).
 * Elementos já visíveis quando a página aparece não fazem revelação. Revela uma vez só.
 * Componentes que montam conteúdo depois podem disparar `window.dispatchEvent(new Event('gg:reveal'))`.
 */
export function RevealObserver() {
  const pathname = usePathname()

  useEffect(() => {
    const reduzir = window.matchMedia(mq.menosMovimento).matches
    const io = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          ;(e.target as HTMLElement).dataset.revelado = ''
          io.unobserve(e.target)
        }
      },
      { rootMargin: '0px 0px -12% 0px' },
    )

    const varrer = () => {
      const vh = window.innerHeight
      document.querySelectorAll<HTMLElement>('[data-reveal]:not([data-revelado]):not([data-observado])').forEach(el => {
        const r = el.getBoundingClientRect()
        if (reduzir || (r.top < vh * 0.88 && r.bottom > 0)) {
          el.dataset.revelado = 'imediato'
        } else {
          el.dataset.observado = ''
          io.observe(el)
        }
      })
    }

    varrer()
    window.addEventListener('gg:reveal', varrer)
    return () => {
      window.removeEventListener('gg:reveal', varrer)
      io.disconnect()
      document.querySelectorAll<HTMLElement>('[data-observado]').forEach(el => delete el.dataset.observado)
    }
  }, [pathname])

  return null
}
