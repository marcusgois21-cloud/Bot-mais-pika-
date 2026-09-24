'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { TransitionLink } from './TransitionLink'
import { Lockup } from '@/components/marca/Lockup'
import { Botao } from '@/components/sistema/Botao'
import { VerPorDentroBotao } from '@/components/dentro/VerPorDentroBotao'
import { CopiarEmail } from '@/components/sistema/CopiarEmail'
import { NAV } from '@/content/site'
import styles from './Header.module.css'

/**
 * Header (spec §15.1): 56 px fixo; transparente no topo, fundo a 94% depois de 24 px; recolhe rolando
 * para baixo depois de 480 px e volta em qualquer subida ≥ 8 px; nunca recolhe com menu aberto ou foco dentro.
 * Sobre a Visão (superfície papel) troca de tom. Mobile: menu em tela cheia revelado por corte.
 */
export function Header({ email }: { email?: string }) {
  const pathname = usePathname()
  const [aberto, setAberto] = useState(false)
  const [rolado, setRolado] = useState(false)
  const [recolhido, setRecolhido] = useState(false)
  const [papel, setPapel] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const botaoMenuRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const atual = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(href))

  // Scroll: listener passivo, agrupado em rAF, só troca classes.
  useEffect(() => {
    let ultimoY = window.scrollY
    let raf = 0
    const aoRolar = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const y = window.scrollY
        setRolado(y > 24)
        const focoDentro = headerRef.current?.contains(document.activeElement)
        if (y > 480 && y - ultimoY > 0 && !focoDentro) setRecolhido(true)
        else if (ultimoY - y >= 8 || y <= 480) setRecolhido(false)
        if (Math.abs(y - ultimoY) >= 8 || y <= 480) ultimoY = y
      })
    }
    aoRolar()
    window.addEventListener('scroll', aoRolar, { passive: true })
    return () => {
      window.removeEventListener('scroll', aoRolar)
      cancelAnimationFrame(raf)
    }
  }, [])

  // Tom papel quando a faixa do header está sobre uma superfície papel (a Visão).
  useEffect(() => {
    const alvos = document.querySelectorAll('[data-surface="papel"]')
    if (!alvos.length) {
      setPapel(false)
      return
    }
    const visiveis = new Set<Element>()
    const io = new IntersectionObserver(
      entries => {
        for (const e of entries) e.isIntersecting ? visiveis.add(e.target) : visiveis.delete(e.target)
        setPapel(visiveis.size > 0)
      },
      { rootMargin: `0px 0px -${Math.max(0, window.innerHeight - 28)}px 0px` },
    )
    alvos.forEach(a => io.observe(a))
    return () => io.disconnect()
  }, [pathname])

  // Fecha o menu ao trocar de rota.
  useEffect(() => setAberto(false), [pathname])

  // Menu aberto: inert fora dele, foco preso, Esc fecha e devolve o foco.
  useEffect(() => {
    const fora = [document.getElementById('conteudo'), document.querySelector('footer.site-footer')].filter(Boolean) as HTMLElement[]
    if (!aberto) {
      fora.forEach(el => el.removeAttribute('inert'))
      return
    }
    fora.forEach(el => el.setAttribute('inert', ''))
    document.documentElement.style.overflow = 'hidden'
    const primeiro = menuRef.current?.querySelector<HTMLElement>('a, button')
    primeiro?.focus()
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAberto(false)
        botaoMenuRef.current?.focus()
        return
      }
      if (e.key !== 'Tab' || !headerRef.current) return
      const focaveis = Array.from(headerRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')).filter(
        el => el.offsetParent !== null,
      )
      if (!focaveis.length) return
      const i = focaveis.indexOf(document.activeElement as HTMLElement)
      if (e.shiftKey && i <= 0) {
        e.preventDefault()
        focaveis[focaveis.length - 1].focus()
      } else if (!e.shiftKey && i === focaveis.length - 1) {
        e.preventDefault()
        focaveis[0].focus()
      }
    }
    document.addEventListener('keydown', tecla)
    return () => {
      document.removeEventListener('keydown', tecla)
      document.documentElement.style.overflow = ''
      fora.forEach(el => el.removeAttribute('inert'))
    }
  }, [aberto])

  const naPaginaContato = pathname.startsWith('/contato')

  return (
    <header
      ref={headerRef}
      className={`site-header ${styles.header}`}
      data-rolado={rolado || undefined}
      data-recolhido={(recolhido && !aberto) || undefined}
      data-tone={papel && !aberto ? 'papel' : undefined}
      data-aberto={aberto || undefined}
      onFocus={() => setRecolhido(false)}
    >
      <div className={styles.barra}>
        <TransitionLink href="/" className={styles.marca} aria-label="Gois Group — página inicial">
          <Lockup altura={12} />
        </TransitionLink>

        <nav aria-label="Principal" className={styles.nav}>
          <ul className={styles.links}>
            {NAV.map(item => (
              <li key={item.href}>
                <TransitionLink
                  href={item.href}
                  className={styles.link}
                  aria-current={atual(item.href) ? 'page' : undefined}
                >
                  {item.rotulo}
                </TransitionLink>
              </li>
            ))}
          </ul>
          {!naPaginaContato && (
            <Botao href="/contato/?origem=header" variante="header">
              Iniciar um projeto
            </Botao>
          )}
        </nav>

        <button
          ref={botaoMenuRef}
          type="button"
          className={styles.menuBotao}
          aria-expanded={aberto}
          aria-controls="menu-mobile"
          onClick={() => setAberto(a => !a)}
        >
          {aberto ? 'Fechar' : 'Menu'}
        </button>
      </div>

      <div id="menu-mobile" ref={menuRef} className={styles.menu} data-aberto={aberto || undefined} hidden={!aberto}>
        <nav aria-label="Menu" className={styles.menuConteudo}>
          <ul className={styles.menuLinks}>
            {[...NAV, { href: '/contato/', rotulo: 'Contato' }].map(item => (
              <li key={item.href}>
                <TransitionLink
                  href={item.href}
                  className={`t-display-m ${styles.menuLink}`}
                  aria-current={atual(item.href) ? 'page' : undefined}
                  onClick={() => setAberto(false)}
                >
                  {item.rotulo}
                </TransitionLink>
              </li>
            ))}
          </ul>
          <div className={styles.menuAcoes}>
            <Botao href="/contato/?origem=menu" largo seta>
              Iniciar um projeto
            </Botao>
            <VerPorDentroBotao />
            {email && <CopiarEmail email={email} />}
          </div>
        </nav>
      </div>
    </header>
  )
}
