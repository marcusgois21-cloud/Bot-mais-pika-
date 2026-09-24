'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { TransitionLink } from '@/components/layout/TransitionLink'
import { Seta } from './Icone'
import { mq } from '@/lib/breakpoints'
import styles from './Botao.module.css'

type Base = {
  children: ReactNode
  variante?: 'primario' | 'secundario' | 'header'
  /** magnetismo ≤ 3 px — só nos CTAs primários do hero, da seção 08 e do Sobre (spec §17) */
  magnetico?: boolean
  seta?: boolean
  largo?: boolean
  className?: string
  'data-dentro'?: string
}
type ComoLink = Base & { href: string; onClick?: never; type?: never; 'aria-pressed'?: never }
type ComoBotao = Base & { href?: undefined; onClick?: () => void; type?: 'button' | 'submit'; 'aria-pressed'?: boolean; disabled?: boolean }

function useMagnetismo(ativo: boolean) {
  const ref = useRef<HTMLElement | null>(null)
  useEffect(() => {
    const el = ref.current
    if (!ativo || !el) return
    if (!window.matchMedia(mq.ponteiroFino).matches || window.matchMedia(mq.menosMovimento).matches) return
    let raf = 0
    let dx = 0
    let dy = 0
    const mover = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      const zona = 24
      const dentro = e.clientX > r.left - zona && e.clientX < r.right + zona && e.clientY > r.top - zona && e.clientY < r.bottom + zona
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      const alvoX = dentro ? Math.max(-3, Math.min(3, (e.clientX - cx) * 0.12)) : 0
      const alvoY = dentro ? Math.max(-3, Math.min(3, (e.clientY - cy) * 0.12)) : 0
      if (alvoX === dx && alvoY === dy) return
      dx = alvoX
      dy = alvoY
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        el.style.transform = dx || dy ? `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0)` : ''
      })
    }
    window.addEventListener('pointermove', mover, { passive: true })
    return () => {
      window.removeEventListener('pointermove', mover)
      cancelAnimationFrame(raf)
      el.style.transform = ''
    }
  }, [ativo])
  return ref
}

export function Botao(props: ComoLink | ComoBotao) {
  const { children, variante = 'primario', magnetico, seta, largo, className, href } = props
  const ref = useMagnetismo(Boolean(magnetico))
  const cls = [styles.botao, styles[variante], largo ? styles.largo : '', className ?? ''].join(' ')
  const conteudo = (
    <>
      <span className={styles.rotulo}>{children}</span>
      {seta && <Seta className={styles.seta} />}
    </>
  )
  if (href !== undefined) {
    return (
      <TransitionLink href={href} className={cls} ref={ref as React.Ref<HTMLAnchorElement>} data-dentro={props['data-dentro']}>
        {conteudo}
      </TransitionLink>
    )
  }
  const p = props as ComoBotao
  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      type={p.type ?? 'button'}
      className={cls}
      onClick={p.onClick}
      aria-pressed={p['aria-pressed']}
      disabled={p.disabled}
      data-dentro={props['data-dentro']}
    >
      {conteudo}
    </button>
  )
}
