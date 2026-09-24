'use client'

import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { heroCopy } from '@/content/copy/hero'
import { BUILD_DATE, BUILD_SHA } from '@/lib/env'
import derivados from '@/content/generated/derivados.json'
import { mq } from '@/lib/breakpoints'
import { dataCurta, numero, porExtenso } from '@/lib/formatar'
import {
  amortecer,
  chamada,
  colunaMaisProxima,
  inteiraEmRepouso,
  levantamento,
  linhasVisuais,
  posicaoDaColuna,
  posicionarRotulo,
  resolverColisoes,
  type Anotacao,
  type Levantamento,
  type Medidas,
  type Retangulo,
  type RetanguloTexto,
} from './levantamento'

/**
 * CutPlane (spec §6.2–§6.6): mede o layout real do hero, desenha o Levantamento atrás do texto e move o
 * corte. Carregado depois da hidratação (CutPlaneTardio). Em repouso não há trabalho por quadro: o rAF
 * só existe enquanto o corte está a caminho do cursor.
 *
 * Estilos: Hero.module.css, pelos atributos data-lev / data-s / data-cota / data-anot (este arquivo não
 * importa o módulo de CSS, para o pedaço de JS carregado depois da hidratação ficar pequeno).
 */

/** esquerda: borda do conteúdo em relação ao hero · naTela: a mesma borda na viewport (para o ponteiro) */
type Geo = { esquerda: number; naTela: number; largura: number; colunas: number; gutter: number; repouso: number }
type Extra = { peso: string; fs: number; lh: number; ctaH: number }
type Estado = { lev: Levantamento; m: Medidas; extra: Extra }

const inteiro = (n: number) => numero(Math.round(n))
const A = heroCopy.anotacoes

function medir(sec: HTMLElement): { m: Medidas; geo: Omit<Geo, 'repouso'>; extra: Extra } | null {
  const grade = sec.querySelector<HTMLElement>('[data-hero-grade]')
  const h1 = sec.querySelector<HTMLElement>('h1')
  if (!grade || !h1) return null
  const s = sec.getBoundingClientRect()
  const g = grade.getBoundingClientRect()
  const cs = getComputedStyle(grade)
  const pad = parseFloat(cs.paddingLeft) || 0
  const ox = g.left + pad
  const oy = s.top
  const largura = g.width - 2 * pad
  const colunas = parseInt(cs.getPropertyValue('--cols'), 10) || 12
  const gutter = parseFloat(cs.columnGap) || 0
  const colunaCorte = parseInt(cs.getPropertyValue('--col-corte'), 10) || colunas
  const ret = (el: Element | null | undefined): Retangulo => {
    const r = el ? el.getBoundingClientRect() : { left: ox, top: oy, width: 0, height: 0 }
    return { x: r.left - ox, y: r.top - oy, w: r.width, h: r.height }
  }
  const alvo = (nome: string) => sec.querySelector(`[data-hero-alvo="${nome}"]`)

  // Linhas visuais do H1: só os nós de texto (as caixas dos <span> em bloco ocupam a largura toda).
  const rets: RetanguloTexto[] = []
  const faixa = document.createRange()
  const nos = document.createTreeWalker(h1, NodeFilter.SHOW_TEXT)
  for (let n = nos.nextNode(); n; n = nos.nextNode()) {
    const t = n.textContent ?? ''
    const ini = t.search(/\S/)
    if (ini < 0) continue
    faixa.setStart(n, ini)
    faixa.setEnd(n, t.trimEnd().length)
    for (const r of Array.from(faixa.getClientRects())) {
      if (r.width > 0.5) rets.push({ esquerda: r.left - ox, direita: r.right - ox, topo: r.top - oy, base: r.bottom - oy })
    }
  }
  const tcs = getComputedStyle(h1)
  const fs = parseFloat(tcs.fontSize)
  const lh = parseFloat(tcs.lineHeight) || fs * 0.94

  // CTA: o invólucro (o botão pode estar deslocado pelo magnetismo).
  const cta = ret(alvo('cta'))

  return {
    m: {
      W: s.right - ox,
      H: sec.clientHeight,
      largura,
      colunas,
      gutter,
      colunaCorte,
      corteExtra: parseFloat(cs.getPropertyValue('--corte-extra')) || 0,
      topoConteudo: g.top - oy + (parseFloat(cs.paddingTop) || 0),
      topoFaixa: parseFloat(getComputedStyle(sec).getPropertyValue('--header-h')) || 56,
      titulo: { fs, lh, linhas: linhasVisuais(rets) },
      eyebrow: ret(alvo('eyebrow')),
      subtitulo: ret(alvo('sub')),
      cta,
      ctaSecundario: ret(alvo('cta2')),
      anotacoes: parseInt(cs.getPropertyValue('--anotacoes'), 10) || 0,
    },
    geo: { esquerda: ox - s.left, naTela: ox, largura, colunas, gutter },
    extra: { peso: tcs.fontWeight, fs, lh, ctaH: cta.h },
  }
}

/** A linha de negócio e a linha técnica (segmentos) de cada anotação. */
function textos(a: Anotacao, { lev, m, extra }: Estado): [string, string[]] {
  switch (a.id) {
    case 'grade':
      return [A.grade.principal(porExtenso(m.colunas)), A.grade.tecnica(inteiro(lev.colW), inteiro(m.gutter), inteiro(lev.margem))]
    case 'titulo':
      return [A.titulo.principal, A.titulo.tecnica(extra.peso, inteiro(extra.fs), inteiro(extra.lh))]
    case 'leitura':
      return [A.leitura.principal, A.leitura.tecnica]
    case 'botao':
      // o contraste do botão vem do build (--btn-fg sobre --btn-bg, scripts/derive-tokens.mjs): o mesmo número
      // da seção Capacidade, de uma fonte só — e nunca o de um hover que estivesse ativo na hora da medida
      return [A.botao.principal(inteiro(extra.ctaH)), A.botao.tecnica(numero(derivados.botaoPrimario.contraste, 2))]
    default:
      return [A.versao.principal(dataCurta(BUILD_DATE)), A.versao.tecnica(BUILD_SHA)]
  }
}

export function CutPlane() {
  const raiz = useRef<HTMLDivElement>(null)
  const abrir = useRef(() => {})
  const [estado, setEstado] = useState<Estado | null>(null)
  /** 2ª passagem: topo de cada anotação, x de cada rótulo de cota (null = não cabe inteiro em repouso) e chamadas */
  const [pos, setPos] = useState<{ topos: number[]; rotulos: (number | null)[]; chamadas: string } | null>(null)

  useEffect(() => {
    const sec = raiz.current?.closest<HTMLElement>('[data-hero]')
    if (!sec) return
    const ds = sec.dataset
    const st = sec.style
    const range = sec.querySelector<HTMLInputElement>('[data-hero-range]')
    const cutX = range?.nextElementSibling
    const html = document.documentElement
    const fino = matchMedia(mq.ponteiroFino)
    const reduzir = matchMedia(mq.menosMovimento)

    let vivo = true
    let geo: Geo | null = null
    let aberto = false
    let primeira = false
    let emVista = true
    let ouvindo = false
    let intro = false
    let x = 0
    let alvo = 0
    let raf = 0
    let ultimo = 0
    let largura = -1
    let altura = -1
    let tSalto = 0
    let tMedir = 0
    const timers: number[] = []

    const dentro = () => html.dataset.dentro === 'on'
    const temX = () => !!st.getPropertyValue('--x')
    const definirX = (v: number | null) =>
      v === null ? st.removeProperty('--x') : st.setProperty('--x', `${Math.round(v * 100) / 100}px`)
    /** posição visual atual do corte (inclui uma varredura ou um salto em andamento) */
    const xAtual = () => {
      const t = cutX ? getComputedStyle(cutX).transform : 'none'
      return t !== 'none' ? new DOMMatrixReadOnly(t).m41 : geo?.repouso ?? 0
    }
    /** para onde o corte vai (ou onde repousa): o range e a dica seguem o destino, não o trânsito */
    const destino = () => (!geo ? 0 : intro || !temX() ? geo.repouso : raf ? alvo : x)

    /** valor do range na coluna mais próxima de px; sem anúncio enquanto o range não está em foco */
    const valor = (px: number, forcar = false) => {
      if (!range || !geo || (!forcar && document.activeElement === range)) return
      const v = colunaMaisProxima(px, geo.largura, geo.colunas, geo.gutter)
      if (!forcar && range.value === String(v)) return
      range.value = String(v)
      range.setAttribute(
        'aria-valuetext',
        v >= geo.colunas ? heroCopy.corte.depoisDaUltima : heroCopy.corte.naColuna(String(v + 1), String(geo.colunas)),
      )
    }

    // Dica: à direita da alça quando há faixa (a mesma borda das anotações); senão à esquerda, sobre a
    // superfície. Nunca cobre conteúdo: só aparece se couber entre o header e o topo do eyebrow.
    const ladoDica = (px: number) => {
      if (!geo) return
      const direita = geo.largura - px - 16
      ds.ladoDica = direita >= 240 ? 'direita' : 'esquerda'
      st.setProperty('--dica-max', `${Math.round(Math.min(direita >= 240 ? direita : px - 26, 420))}px`)
    }
    const esconderDica = () => delete ds.dica
    const mostrarDica = () => {
      const d = sec.querySelector('[data-hero-dica]')
      const e = sec.querySelector('[data-hero-alvo="eyebrow"]')
      if (primeira && vivo && fino.matches && !reduzir.matches && d && e && d.getBoundingClientRect().bottom <= e.getBoundingClientRect().top - 8)
        ds.dica = ''
    }

    const salto = () => {
      if (reduzir.matches) return
      ds.mov = 'salto'
      clearTimeout(tSalto)
      tSalto = window.setTimeout(() => ds.mov === 'salto' && delete ds.mov, 280)
    }
    const pararLoop = () => {
      cancelAnimationFrame(raf)
      raf = 0
      if (ds.mov === 'cursor') delete ds.mov
    }
    /** o ponteiro, o teclado ou o "Ver por dentro" assumem: a varredura para onde está, sem salto */
    const interromper = () => {
      pararLoop()
      esconderDica()
      primeira = false
      if (!intro) return
      intro = false
      timers.forEach(clearTimeout)
      x = xAtual()
      definirX(x)
      delete ds.mov
    }

    // Cursor: amortecimento independente da taxa de quadros; rAF só enquanto |x − alvo| > 0,5 px.
    const passo = (t: number) => {
      raf = 0
      x = amortecer(x, alvo, Math.min(Math.max(t - ultimo, 0), 100))
      ultimo = t
      const chegou = Math.abs(alvo - x) <= 0.5
      if (chegou) x = alvo
      definirX(chegou && geo && alvo === geo.repouso ? null : x)
      valor(x)
      if (!chegou) raf = requestAnimationFrame(passo)
      else if (ds.mov === 'cursor') delete ds.mov
    }
    const seguir = (novo: number) => {
      alvo = novo
      if (raf) return
      x = xAtual()
      if (Math.abs(alvo - x) <= 0.5) return
      ds.mov = 'cursor'
      ultimo = performance.now()
      raf = requestAnimationFrame(passo)
    }
    const aoMover = (e: PointerEvent) => {
      if (e.pointerType === 'touch' || !geo || dentro() || (e.buttons && e.target === range)) return
      if (intro || ds.dica !== undefined) interromper()
      seguir(Math.min(Math.max(e.clientX - geo.naTela, 0), geo.largura))
    }
    const aoSair = (e: PointerEvent) => {
      if (e.pointerType !== 'touch' && geo && !dentro()) seguir(geo.repouso)
    }

    // Só escuta o ponteiro com cursor fino, movimento permitido, hero na tela e aba visível.
    const escutar = () => {
      const deve = aberto && emVista && fino.matches && !reduzir.matches && !document.hidden
      if (deve === ouvindo) return
      ouvindo = deve
      const f = deve ? sec.addEventListener : sec.removeEventListener
      f.call(sec, 'pointermove', aoMover as EventListener, { passive: true })
      f.call(sec, 'pointerleave', aoSair as EventListener, { passive: true })
      if (!deve) pararLoop()
    }

    // Teclado e toque: uma coluna por passo, Home = margem esquerda, End = margem direita (240 ms). O valor
    // do repouso leva ao repouso exato (em xs e sm, "depois da última coluna" fica na margem).
    const aoRange = () => {
      if (!range || !geo) return
      interromper()
      const v = Number(range.value)
      x = v === colunaMaisProxima(geo.repouso, geo.largura, geo.colunas, geo.gutter) ? geo.repouso : posicaoDaColuna(v, geo.largura, geo.colunas, geo.gutter)
      salto()
      definirX(x)
      valor(x, true)
      ladoDica(x)
    }
    // Com o range em foco, o cursor move o corte sem mexer no valor (nada é anunciado). A tecla seguinte
    // parte da coluna onde o corte está; se ela não mudar o valor (Home já na margem), o corte encaixa ali.
    const aoTecla = (e: KeyboardEvent) => {
      if (!range || !geo || !/^(Arrow|Page|Home|End)/.test(e.key)) return
      const v = String(colunaMaisProxima(destino(), geo.largura, geo.colunas, geo.gutter))
      if (range.value === v) return
      range.value = v
      setTimeout(() => range.value === v && aoRange())
    }
    const aoTocarRange = (e: PointerEvent) => {
      if (e.pointerType === 'touch') ds.manual = ''
    }
    // "Ver por dentro" ligado leva o corte à margem esquerda (o CSS força --x: 0); o range fica inativo.
    const aoDentro = () => {
      interromper()
      if (range) range.disabled = dentro()
      salto()
    }

    const medirAgora = (novaGrade: boolean) => {
      const r = vivo && medir(sec)
      if (!r) return
      const lev = levantamento(r.m)
      geo = { ...r.geo, repouso: lev.xRepouso }
      if (range) range.max = String(geo.colunas)
      if (novaGrade && !dentro()) {
        // grade nova: o corte volta ao repouso, sem animação
        pararLoop()
        definirX(null)
      }
      valor(destino(), true)
      ladoDica(destino())
      setEstado({ lev, m: r.m, extra: r.extra })
    }

    // T0: o Levantamento está desenhado e posicionado (chamado no useLayoutEffect, antes do paint).
    abrir.current = () => {
      if (aberto || !geo) return
      aberto = true
      const navegou = window.__ggNavegou === true
      primeira = html.dataset.intro === 'completa' && !navegou
      if (range) {
        range.hidden = false
        range.disabled = dentro()
      }
      ds.pronto = ''
      // a camada "Ver por dentro" re-mede quando a alça do corte fica visível
      window.dispatchEvent(new Event('gg:reveal'))
      if (reduzir.matches || (!navegou && performance.now() > 1200)) {
        // movimento reduzido, ou passou do teto de 1200 ms: estado final direto, sem abertura
        ds.fase = 'imediata'
        mostrarDica()
      } else if (primeira) {
        // abertura: a página inteira por dentro com o corte na margem; em T0 + 320 ms, varre até o repouso
        ds.fase = 'abertura'
        intro = true
        definirX(0)
        timers.push(
          window.setTimeout(() => {
            ds.mov = 'varredura'
            definirX(null)
          }, 320),
          window.setTimeout(() => {
            intro = false
            if (ds.mov === 'varredura') delete ds.mov
            mostrarDica()
          }, 960),
        )
      } else {
        ds.fase = 'curta'
      }
      escutar()
    }

    const io = new IntersectionObserver(([e]) => {
      emVista = e.isIntersecting
      escutar()
    })
    io.observe(sec)
    // Re-medição sem animação: ResizeObserver com debounce de 150 ms e document.fonts "loadingdone".
    const ro = new ResizeObserver(([e]) => {
      const w = Math.round(e.contentRect.width)
      const h = Math.round(e.contentRect.height)
      const mudouW = largura >= 0 && w !== largura
      const mudou = largura >= 0 && (mudouW || h !== altura)
      largura = w
      altura = h
      if (!mudou) return
      clearTimeout(tMedir)
      tMedir = window.setTimeout(() => medirAgora(mudouW), 150)
    })
    const aoFontes = () => medirAgora(false)

    range?.addEventListener('input', aoRange)
    range?.addEventListener('keydown', aoTecla)
    range?.addEventListener('pointerdown', aoTocarRange, { passive: true })
    addEventListener('gg:dentro', aoDentro)
    document.addEventListener('visibilitychange', escutar)
    reduzir.addEventListener('change', escutar)
    document.fonts.addEventListener('loadingdone', aoFontes)

    // Montagem: espera as fontes (no máximo 400 ms) e mede.
    Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 400))]).then(() => {
      medirAgora(false)
      if (vivo) ro.observe(sec)
    })

    return () => {
      vivo = false
      pararLoop()
      timers.forEach(clearTimeout)
      clearTimeout(tSalto)
      clearTimeout(tMedir)
      io.disconnect()
      ro.disconnect()
      ouvindo = true
      aberto = false
      escutar()
      range?.removeEventListener('input', aoRange)
      range?.removeEventListener('keydown', aoTecla)
      range?.removeEventListener('pointerdown', aoTocarRange)
      removeEventListener('gg:dentro', aoDentro)
      document.removeEventListener('visibilitychange', escutar)
      reduzir.removeEventListener('change', escutar)
      document.fonts.removeEventListener('loadingdone', aoFontes)
    }
  }, [])

  // 2ª passagem (antes do paint): colisões e chamadas das anotações; rótulos de cota dentro do hero e
  // inteiros em repouso (senão a cota inteira sai).
  useLayoutEffect(() => {
    if (!estado || !raiz.current) return
    const { lev } = estado
    const anot = raiz.current.querySelectorAll<HTMLElement>('[data-anot]')
    const rot = raiz.current.querySelectorAll<HTMLElement>('[data-cota]')
    const hs = lev.anotacoes.map((_, i) => anot[i]?.offsetHeight ?? 0)
    const topos = resolverColisoes(
      // 1 px abaixo da âncora: a linha medida continua visível logo acima do recorte da anotação
      lev.anotacoes.map((a, i) => ({ y: a.alinhar === 'topo' ? a.y + 1 : a.y, h: hs[i], alinhar: a.alinhar })),
      12,
      lev.H - 32,
    )
    setPos({
      topos,
      rotulos: lev.rotulosCota.map((r, i) => {
        const w = rot[i]?.offsetWidth ?? 0
        const x = r.lado === 'direita' ? r.x : posicionarRotulo(r.x, w, lev.W)
        return inteiraEmRepouso(Math.min(x, r.x0), Math.max(x + w, r.x1), lev.xRepouso) ? x : null
      }),
      chamadas: lev.anotacoes.map((a, i) => chamada(a, topos[i], hs[i], lev.xRepouso)).join(''),
    })
  }, [estado])

  useLayoutEffect(() => {
    if (pos) abrir.current()
  }, [pos])

  if (!estado) return <div ref={raiz} data-lev />
  const { lev } = estado

  return (
    <div ref={raiz} data-lev>
      <svg width="100%" height="100%" focusable="false">
        <defs>
          <pattern id="gg-hachura" width="6" height="6" patternUnits="userSpaceOnUse">
            <path data-s="hachura" d="M-1 1L1 -1M0 6L6 0M5 7L7 5" />
          </pattern>
        </defs>
        <path data-s="colunas" d={lev.colunas} />
        <path data-s="intervalos" d={lev.intervalos} fill="url(#gg-hachura)" />
        <path data-s="baselines" d={lev.baselines} />
        <path data-s="leitura" d={lev.leitura} />
        <path data-s="caixas" d={lev.caixas} />
        <path data-s="cotas" d={lev.rotulosCota.map((r, i) => (pos?.rotulos[i] == null ? '' : r.d)).join('')} />
        <path data-s="chamadas" d={pos?.chamadas} />
      </svg>
      <div>
        {lev.rotulosCota.map((r, i) => {
          // sempre no DOM (a 2ª passagem mede a largura); fora da janela, invisível
          const x = pos?.rotulos[i]
          return (
            <span key={r.id} className="t-micro" data-cota={r.lado} style={{ left: x ?? r.x, top: r.y, visibility: x === null ? 'hidden' : undefined }}>
              {heroCopy.cota(numero(r.px))}
            </span>
          )
        })}
        {lev.anotacoes.map((a, i) => {
          const [principal, tecnica] = textos(a, estado)
          return (
            <p key={a.id} data-anot style={{ left: lev.anotacaoX, top: pos?.topos[i] ?? a.y, maxWidth: lev.anotacaoLargura + 12 }}>
              <span className="t-small">{principal}</span>
              {/* segmentos inteiros: a linha técnica só quebra entre medidas, nunca no meio de uma */}
              <span className="t-micro">
                {tecnica.map((seg, j) => (
                  <Fragment key={j}>
                    <span>{j < tecnica.length - 1 ? `${seg} ·` : seg}</span>{' '}
                  </Fragment>
                ))}
              </span>
            </p>
          )
        })}
      </div>
    </div>
  )
}
