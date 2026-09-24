'use client'

import { useEffect, useRef, useState } from 'react'
import { Txt } from '@/components/sistema/Txt'
import { contagemExibidas, paginaEmpresas } from '@/content/copy/empresas'
import type { Texto } from '@/lib/conteudo'
import s from './Conectores.module.css'

/** Pedido de nova medição (troca de vista, filtros). */
const MEDIR = 'gg:mapa'

type Seg = [number, number, number, number]

/** Linha nítida de 1 px: coordenada no meio do pixel. */
const px = (v: number) => Math.round(v) + 0.5
const r = (v: number) => Math.round(v)

function linkDe(alvo: EventTarget | null): HTMLAnchorElement | null {
  return alvo instanceof Element ? alvo.closest<HTMLAnchorElement>('a[data-no-link]') : null
}

/**
 * Conectores ortogonais medidos e seleção do mapa (spec §9.2, §9.3).
 * Mede cada marcador e as bordas do centro relativos ao campo; a rota vai do nó até a linha do meio na
 * vertical e daí até a borda do centro na horizontal (nós no eixo: direto na vertical; nós cuja coluna
 * já tem um vizinho no caminho descem pela canaleta ao lado). Contínuo = empresa publicada; pontilhado
 * 1 2 = espaço reservado ou empresa-modelo. Hover e foco (o mesmo comportamento) acendem o caminho em
 * Rubrica, esmaecem os outros nós e trocam a ficha; Esc limpa. Sem JS: nós e centro, sem conectores.
 */
export function Conectores() {
  const ref = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const svg = ref.current
    const campo = svg?.parentElement
    const raiz = campo?.closest<HTMLElement>('[data-ecossistema]')
    const centro = campo?.querySelector<HTMLElement>('[data-centro]')
    if (!svg || !campo || !raiz || !centro) return

    let ativo: string | null = null
    let ponteiroDentro = false
    let espera = 0
    let limpaVt = 0

    function medir() {
      if (!svg || !campo || !centro) return
      if (getComputedStyle(svg).display === 'none') {
        // vista Lista ou abaixo de 900 px: sem conectores e sem seleção visual
        svg.replaceChildren()
        selecionar(null)
        return
      }
      const b = campo.getBoundingClientRect()
      const c = centro.getBoundingClientRect()
      const L = r(c.left - b.left)
      const R = r(c.right - b.left)
      const T = r(c.top - b.top)
      const B = r(c.bottom - b.top)
      const meio = px((c.top + c.bottom) / 2 - b.top)
      const vao = parseFloat(getComputedStyle(campo).columnGap) || 0
      const coluna = (b.width - 11 * vao) / 12
      svg.setAttribute('viewBox', `0 0 ${r(b.width)} ${r(b.height)}`)

      let html = ''
      campo.querySelectorAll<HTMLElement>('[data-no]').forEach(li => {
        if (li.hidden) return
        const m = li.querySelector<HTMLElement>('[data-marcador-no]')?.getBoundingClientRect()
        if (!m || !m.width) return
        const x = px(m.left + m.width / 2 - b.left)
        const cy = m.top + m.height / 2 - b.top
        const topo = r(m.top - b.top)
        const base = r(m.bottom - b.top)
        const lado = li.dataset.lado
        let segs: Seg[]
        if (lado === 'eixo') {
          segs = cy < meio ? [[x, base, x, T]] : [[x, topo, x, B]]
        } else {
          const fim = lado === 'esq' ? L : R
          const corredor = Number(li.dataset.corredor)
          if (corredor) {
            // até a canaleta à direita da coluna N, desce (ou sobe) por ela e segue para o centro
            const xc = px(corredor * (coluna + vao) - vao / 2)
            const y = px(cy)
            segs = [
              [lado === 'esq' ? r(m.right - b.left) : r(m.left - b.left), y, xc, y],
              [xc, y, xc, meio],
              [xc, meio, fim, meio],
            ]
          } else if (Math.abs(cy - meio) < m.height) {
            // nó na linha do meio: a vertical tem comprimento zero
            segs = [[lado === 'esq' ? r(m.right - b.left) : r(m.left - b.left), meio, fim, meio]]
          } else {
            segs = [
              [x, cy < meio ? base : topo, x, meio],
              [x, meio, fim, meio],
            ]
          }
        }
        const d = `M${segs[0][0]} ${segs[0][1]}` + segs.map(([x1, , x2, y2]) => (x1 === x2 ? `V${y2}` : `H${x2}`)).join('')
        const reservado = li.dataset.no === 'reservado'
        const pontilhado = reservado || li.hasAttribute('data-modelo')
        const slug = li.dataset.slug ?? ''
        html += `<g data-conector="${slug}"${pontilhado ? ' data-pontilhado=""' : ''}${slug && slug === ativo ? ' data-ativo=""' : ''}>`
        html += `<path data-base="" d="${d}"/>`
        if (!reservado) {
          // o corte redesenha o caminho trecho a trecho, do nó ao centro
          segs.forEach(([x1, y1, x2, y2], k) => {
            const vertical = x1 === x2
            const origem = vertical ? `50% ${y2 > y1 ? '0%' : '100%'}` : `${x2 > x1 ? '0%' : '100%'} 50%`
            html += `<line data-corte="${vertical ? 'v' : 'h'}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="transform-origin:${origem};--i:${k};--n:${segs.length}"/>`
          })
        }
        html += '</g>'
      })
      svg.innerHTML = html
      // a empresa selecionada saiu do filtro: a seleção visual não sobrevive
      if (ativo && campo.querySelector<HTMLElement>(`[data-no][data-slug="${CSS.escape(ativo)}"]`)?.hidden) selecionar(null)
    }

    function selecionar(slug: string | null) {
      if (!raiz || !svg || slug === ativo) return
      ativo = slug
      if (slug) raiz.dataset.selecao = slug
      else delete raiz.dataset.selecao
      raiz.querySelectorAll<HTMLElement>('[data-no]').forEach(li => li.toggleAttribute('data-ativo', !!slug && li.dataset.slug === slug))
      raiz.querySelectorAll<HTMLElement>('[data-ficha]').forEach(f => f.toggleAttribute('data-ativa', (f.dataset.ficha || null) === slug))
      svg.toggleAttribute('data-selecao', !!slug)
      svg.querySelectorAll<SVGGElement>('[data-conector]').forEach(g => g.toggleAttribute('data-ativo', !!slug && g.dataset.conector === slug))
    }

    const agendar = () => {
      window.clearTimeout(espera)
      espera = window.setTimeout(medir, 150)
    }
    const aoPedido = () => {
      window.clearTimeout(espera)
      medir()
    }
    const aoPassar = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      const a = linkDe(e.target)
      if (a) selecionar(a.dataset.noLink ?? null)
    }
    const aoEntrar = () => {
      ponteiroDentro = true
    }
    const aoSair = () => {
      ponteiroDentro = false
      if (!linkDe(document.activeElement)) selecionar(null)
    }
    const aoFocar = (e: FocusEvent) => {
      const a = linkDe(e.target)
      if (a) selecionar(a.dataset.noLink ?? null)
    }
    const aoDesfocar = (e: FocusEvent) => {
      if (!linkDe(e.relatedTarget) && !ponteiroDentro) selecionar(null)
    }
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && ativo) selecionar(null)
    }
    // Continuidade nome para H1 (spec §16): o H1 do detalhe só ganha o nome de transição quando a
    // navegação partiu de um nó.
    const aoClicar = (e: MouseEvent) => {
      if (!linkDe(e.target)) return
      document.documentElement.dataset.vtEmpresa = ''
      window.clearTimeout(limpaVt)
      limpaVt = window.setTimeout(() => delete document.documentElement.dataset.vtEmpresa, 1200)
    }

    medir()
    document.fonts?.ready.then(medir).catch(() => {})
    const ro = new ResizeObserver(agendar)
    ro.observe(campo)
    ro.observe(centro)
    raiz.addEventListener(MEDIR, aoPedido)
    raiz.addEventListener('pointerover', aoPassar)
    raiz.addEventListener('pointerenter', aoEntrar)
    raiz.addEventListener('pointerleave', aoSair)
    raiz.addEventListener('focusin', aoFocar)
    raiz.addEventListener('focusout', aoDesfocar)
    raiz.addEventListener('click', aoClicar)
    document.addEventListener('keydown', aoTeclar)
    return () => {
      ro.disconnect()
      window.clearTimeout(espera)
      raiz.removeEventListener(MEDIR, aoPedido)
      raiz.removeEventListener('pointerover', aoPassar)
      raiz.removeEventListener('pointerenter', aoEntrar)
      raiz.removeEventListener('pointerleave', aoSair)
      raiz.removeEventListener('focusin', aoFocar)
      raiz.removeEventListener('focusout', aoDesfocar)
      raiz.removeEventListener('click', aoClicar)
      document.removeEventListener('keydown', aoTeclar)
    }
  }, [])

  return <svg ref={ref} className={s.conectores} aria-hidden="true" focusable="false" />
}

/* ── /empresas/: alternador Mapa · Lista e filtros ────────────────────────── */

type Opcao = { valor: string; rotulo: Texto }
type Vista = 'mapa' | 'lista'

function lerLista(p: URLSearchParams, chave: string, validos: Opcao[]): string[] {
  const v = p.get(chave)
  if (!v) return []
  const ok = new Set(validos.map(o => o.valor))
  return v.split(',').filter(x => ok.has(x))
}

/**
 * Alternador (só com ≥ 1 empresa) e filtros (só com ≥ 6), spec §14.1. As duas vistas restilizam o mesmo
 * <ol>. Filtros: dentro de um grupo, qualquer opção marcada; entre grupos, todas. Estado na URL
 * (?status=, ?relacao=) e contagem em aria-live.
 */
export function ControlesVista({
  alternador,
  filtros,
  vistaInicial,
  total,
  status,
  relacoes,
}: {
  alternador: boolean
  filtros: boolean
  vistaInicial: Vista
  total: number
  status: Opcao[]
  relacoes: Opcao[]
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [vista, setVista] = useState<Vista>(vistaInicial)
  const [sel, setSel] = useState<{ status: string[]; relacao: string[] }>({ status: [], relacao: [] })
  const [lido, setLido] = useState(false)
  const [exibidas, setExibidas] = useState(total)

  // Estado inicial a partir da URL (export estático: lido no cliente).
  useEffect(() => {
    if (filtros) {
      const p = new URLSearchParams(window.location.search)
      setSel({ status: lerLista(p, 'status', status), relacao: lerLista(p, 'relacao', relacoes) })
    }
    setLido(true)
  }, [filtros, status, relacoes])

  useEffect(() => {
    const raiz = ref.current?.closest<HTMLElement>('[data-ecossistema]')
    if (!raiz || !lido) return
    raiz.dataset.vista = vista
    const itens = [...raiz.querySelectorAll<HTMLElement>('[data-no="empresa"]')]
    let n = 0
    let ultimo: HTMLElement | null = null
    for (const li of itens) {
      const passa =
        (!sel.status.length || sel.status.includes(li.dataset.status ?? '')) &&
        (!sel.relacao.length || sel.relacao.includes(li.dataset.relacao ?? ''))
      li.hidden = !passa
      li.removeAttribute('data-ultimo')
      if (passa) {
        n++
        ultimo = li
      }
    }
    ultimo?.setAttribute('data-ultimo', '')
    setExibidas(n)
    raiz.dispatchEvent(new Event(MEDIR))

    if (filtros) {
      // ?status=em-operacao,em-evolucao&relacao=parceira — vírgulas legíveis, outros parâmetros preservados
      const p = new URLSearchParams(window.location.search)
      p.delete('status')
      p.delete('relacao')
      const partes = [p.toString(), ...(['status', 'relacao'] as const).filter(k => sel[k].length).map(k => `${k}=${sel[k].join(',')}`)].filter(Boolean)
      const destino = `${window.location.pathname}${partes.length ? `?${partes.join('&')}` : ''}${window.location.hash}`
      if (destino !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
        window.history.replaceState(window.history.state, '', destino)
      }
    }
  }, [vista, sel, lido, filtros])

  const alternar = (grupo: 'status' | 'relacao', valor: string) =>
    setSel(atual => {
      const lista = atual[grupo]
      return { ...atual, [grupo]: lista.includes(valor) ? lista.filter(x => x !== valor) : [...lista, valor] }
    })

  const t = paginaEmpresas
  return (
    <div ref={ref} className={s.controles} data-dentro="Controles da vista">
      {alternador && (
        <div className={s.alternador} role="group" aria-label={t.alternador.rotulo}>
          {(['mapa', 'lista'] as const).map(v => (
            <button key={v} type="button" className={s.botao} aria-pressed={vista === v} onClick={() => setVista(v)}>
              {t.alternador[v]}
            </button>
          ))}
        </div>
      )}
      {filtros && (
        <>
          <span className={s.quebra} aria-hidden="true" />
          {(
            [
              ['status', t.filtros.status, status],
              ['relacao', t.filtros.relacao, relacoes],
            ] as const
          ).map(([grupo, legenda, opcoes]) =>
            opcoes.length ? (
              <fieldset key={grupo} className={s.filtro}>
                <legend className={`t-small c-3 ${s.legenda}`}>{legenda}</legend>
                <div className={s.opcoes}>
                  {opcoes.map(o => (
                    <label key={o.valor} className={s.opcao}>
                      <input
                        type="checkbox"
                        className={s.caixa}
                        checked={sel[grupo].includes(o.valor)}
                        onChange={() => alternar(grupo, o.valor)}
                      />
                      <span>
                        <Txt t={o.rotulo} />
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null,
          )}
          <p className={`t-small c-2 ${s.contagem}`} aria-live="polite">
            {contagemExibidas(exibidas)}
          </p>
        </>
      )}
    </div>
  )
}
