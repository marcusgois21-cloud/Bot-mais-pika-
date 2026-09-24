'use client'

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type MouseEvent, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { TransitionLink } from './TransitionLink'
import { Botao } from '@/components/sistema/Botao'
import { VerPorDentroBotao } from '@/components/dentro/VerPorDentroBotao'
import { CopiarEmail } from '@/components/sistema/CopiarEmail'
import { mq } from '@/lib/breakpoints'
import styles from './Header.module.css'

type ItemNav = { readonly href: string; readonly rotulo: string }

const rotaDe = (href: string) => href.split(/[?#]/)[0]
const semAssinatura = () => () => {}

/**
 * Header (spec §15.1): 56 px fixo; transparente no topo, fundo a 94% depois de 24 px; recolhe rolando
 * para baixo depois de 480 px e volta em qualquer subida ≥ 8 px; nunca recolhe com menu aberto ou foco dentro.
 * Sobre a Visão (superfície papel) troca de tom. Mobile: menu em tela cheia revelado por corte.
 *
 * `marca` (o lockup) e `nav` chegam prontos do layout, renderizados no servidor: o desenho do wordmark e o
 * conteúdo do site não entram no JS do cliente.
 */
export function Header({ marca, nav, email }: { marca: ReactNode; nav: readonly ItemNav[]; email?: string }) {
  const pathname = usePathname()
  // O menu pertence à rota em que abriu: trocar de rota o fecha no mesmo commit da página nova
  // (o corte parte do menu aberto, sem mostrar antes a página que estava por baixo).
  const [menuEm, setMenuEm] = useState<string | null>(null)
  const aberto = menuEm === pathname
  const [rolado, setRolado] = useState(false)
  const [recolhido, setRecolhido] = useState(false)
  const [papel, setPapel] = useState(false)
  // Sem JS (ou antes de o bundle rodar), "Menu" é um link para a navegação do rodapé.
  const hidratado = useSyncExternalStore(semAssinatura, () => true, () => false)
  const headerRef = useRef<HTMLElement>(null)
  const botaoMenuRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const rotaNova = useRef(true)

  // aria-current="page" só na rota exata; a seção de um detalhe (Cases em /cases/este-site/) é "true".
  const corrente = (href: string) => {
    const rota = rotaDe(href)
    if (pathname === rota) return 'page' as const
    if (rota !== '/' && pathname.startsWith(rota)) return 'true' as const
    return undefined
  }

  // Rota nova: o header volta a aparecer. O fundo segue a rolagem assim que a transição termina.
  useLayoutEffect(() => {
    setRecolhido(false)
    setPapel(false)
    rotaNova.current = true
  }, [pathname])

  // Scroll: listener passivo, agrupado em rAF, só troca classes. Durante o corte entre páginas o header
  // fica parado (html[data-vt-dir]); o estado é recalculado quando a transição termina (gg:vt-fim).
  useEffect(() => {
    let ultimoY = window.scrollY
    let raf = 0
    const medir = () => {
      raf = 0
      if (document.documentElement.dataset.vtDir) return
      const y = window.scrollY
      setRolado(y > 24)
      if (rotaNova.current) {
        // salto de rota (topo, âncora ou rolagem restaurada) não é o usuário rolando para baixo
        rotaNova.current = false
        ultimoY = y
        setRecolhido(false)
        return
      }
      const focoDentro = headerRef.current?.contains(document.activeElement)
      if (y > 480 && y - ultimoY > 0 && !focoDentro) setRecolhido(true)
      else if (ultimoY - y >= 8 || y <= 480) setRecolhido(false)
      if (Math.abs(y - ultimoY) >= 8 || y <= 480) ultimoY = y
    }
    const aoRolar = () => {
      if (!raf) raf = requestAnimationFrame(medir)
    }
    medir()
    window.addEventListener('scroll', aoRolar, { passive: true })
    window.addEventListener('gg:vt-fim', aoRolar)
    return () => {
      window.removeEventListener('scroll', aoRolar)
      window.removeEventListener('gg:vt-fim', aoRolar)
      cancelAnimationFrame(raf)
    }
  }, [])

  // Tom papel quando a faixa do header está sobre uma superfície papel (a Visão).
  useEffect(() => {
    const alvos = document.querySelectorAll('[data-surface="papel"]')
    if (!alvos.length) return
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

  // Menu aberto: foco preso, inert em <main> e <footer>, Esc fecha e devolve o foco.
  // O inert (recálculo de estilo de ~900 elementos) entra quando o corte do menu já cobriu a página, fora
  // do quadro da interação (INP); até lá o Tab já está preso no menu. O fundo não é travado com
  // overflow no <html> (relayout do documento inteiro): o menu contém a própria rolagem
  // (overscroll-behavior) e a barra do header não arrasta a página (touch-action).
  // A partir de 900 px o menu não existe: se a janela cruzar o breakpoint (tablet girando), fecha e
  // devolve tudo. Layout effect: entra e sai no mesmo quadro da troca de estado (e da troca de rota).
  useLayoutEffect(() => {
    if (!aberto) return
    const html = document.documentElement
    const fora = [document.getElementById('conteudo'), document.querySelector<HTMLElement>('footer.site-footer')].filter(
      (el): el is HTMLElement => el !== null,
    )
    html.dataset.menuAberto = ''
    menuRef.current?.querySelector<HTMLElement>('a, button')?.focus()
    const espera = window.matchMedia(mq.menosMovimento).matches ? 0 : 320
    let timer = 0
    const raf = requestAnimationFrame(() => {
      timer = window.setTimeout(() => fora.forEach(el => (el.inert = true)), espera)
    })

    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuEm(null)
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
    const desktop = window.matchMedia(mq.md)
    const aoMudar = () => {
      if (!desktop.matches) return
      const focoNoMenu = menuRef.current?.contains(document.activeElement)
      setMenuEm(null)
      if (focoNoMenu) requestAnimationFrame(() => document.getElementById('conteudo')?.focus({ preventScroll: true }))
    }
    document.addEventListener('keydown', tecla)
    desktop.addEventListener('change', aoMudar)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(timer)
      document.removeEventListener('keydown', tecla)
      desktop.removeEventListener('change', aoMudar)
      delete html.dataset.menuAberto
      fora.forEach(el => (el.inert = false))
    }
  }, [aberto])

  // Link do menu para a própria rota (ou só outra query): não há troca de rota que feche o menu.
  const aoClicarNoMenu = (e: MouseEvent<HTMLElement>) => {
    const a = (e.target as Element).closest('a')
    if (a && new URL(a.href).pathname === window.location.pathname) setMenuEm(null)
  }

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
          {marca}
        </TransitionLink>

        <nav aria-label="Principal" className={styles.nav}>
          <ul className={styles.links}>
            {nav.map(item => (
              <li key={item.href}>
                <TransitionLink href={item.href} className={styles.link} aria-current={corrente(item.href)}>
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

        {hidratado ? (
          <button
            ref={botaoMenuRef}
            type="button"
            className={styles.menuBotao}
            aria-expanded={aberto}
            aria-controls="menu-mobile"
            onClick={() => setMenuEm(aberto ? null : pathname)}
          >
            {aberto ? 'Fechar' : 'Menu'}
          </button>
        ) : (
          <a href="#navegacao-rodape" className={styles.menuBotao}>
            Menu
          </a>
        )}
      </div>

      <div id="menu-mobile" ref={menuRef} className={styles.menu} data-aberto={aberto || undefined} hidden={!aberto} onClick={aoClicarNoMenu}>
        <nav aria-label="Menu" className={styles.menuConteudo}>
          <ul className={styles.menuLinks}>
            {[...nav, { href: '/contato/?origem=menu-contato', rotulo: 'Contato' }].map(item => (
              <li key={item.href}>
                <TransitionLink href={item.href} className={`t-display-m ${styles.menuLink}`} aria-current={corrente(item.href)}>
                  {item.rotulo}
                </TransitionLink>
              </li>
            ))}
          </ul>
          <div className={styles.menuAcoes}>
            {!naPaginaContato && (
              <Botao href="/contato/?origem=menu" largo seta>
                Iniciar um projeto
              </Botao>
            )}
            <VerPorDentroBotao />
            {email && <CopiarEmail email={email} />}
          </div>
        </nav>
      </div>
    </header>
  )
}
