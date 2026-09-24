'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  alturaDoDocumento,
  caixaNoDocumento,
  emCamadaFixa,
  lerGrade,
  linhaDoVazio,
  linhaTecnica,
  renderizado,
  type Caixa,
} from '@/lib/medir'
import s from './DentroOverlay.module.css'

/**
 * Camada "Ver por dentro" (spec §15.3). Carregada com next/dynamic só na primeira ativação (DentroPill).
 *
 * Absoluta sobre o documento, sem ponteiro, aria-hidden, em --z-dentro:
 * - as colunas da grade em faixas de giz a 3% e as linhas de base a cada 8 px, a 2% (só CSS);
 * - para cada [data-dentro] (no máximo 40), uma caixa tracejada 6 4 em --line-ui e um chip com a linha
 *   de negócio (o valor do atributo) e a linha técnica medida agora (tipografia ou dimensões);
 * - para cada [data-dentro-vazio], "Espaço vazio de propósito" com as colunas que ele guarda, e uma cota.
 *
 * Mede ao ligar, na troca de rota e quando o documento muda de tamanho (ResizeObserver, 150 ms de espera;
 * também no fim do carregamento das fontes e no evento `gg:reveal`, que os componentes disparam ao montar
 * conteúdo tardio). Nunca em loop: nenhuma medição dispara outra, e em repouso não há trabalho algum.
 */

const LIMITE = 40
const ESPERA = 150
const VAZIO = 'Espaço vazio de propósito'

type Marca = Caixa & { vazio: boolean; negocio: string; tecnica: string }
type Medicao = { altura: number; largura: number; marcas: Marca[] }

/** Acima de 40: vazios e títulos primeiro, depois ações, depois o resto (empate: ordem do documento). */
function prioridade(el: Element): number {
  if (el.hasAttribute('data-dentro-vazio') || el.tagName === 'H1' || el.tagName === 'H2') return 0
  if (el.tagName === 'A' || el.tagName === 'BUTTON') return 1
  return 2
}

function medir(): Medicao {
  const grade = lerGrade()
  const candidatos = Array.from(document.body.querySelectorAll('[data-dentro], [data-dentro-vazio]')).filter(
    el =>
      (el.hasAttribute('data-dentro-vazio') || Boolean(el.getAttribute('data-dentro')?.trim())) &&
      renderizado(el) &&
      !emCamadaFixa(el),
  )
  const escolhidos =
    candidatos.length <= LIMITE
      ? candidatos
      : candidatos
          .map((el, i) => ({ el, i, p: prioridade(el) }))
          .sort((a, b) => a.p - b.p || a.i - b.i)
          .slice(0, LIMITE)
          .sort((a, b) => a.i - b.i)
          .map(o => o.el)

  const marcas = escolhidos.map(el => {
    const c = caixaNoDocumento(el)
    const vazio = el.hasAttribute('data-dentro-vazio')
    return {
      ...c,
      vazio,
      negocio: vazio ? VAZIO : (el.getAttribute('data-dentro') ?? '').trim(),
      tecnica: vazio ? linhaDoVazio(c, grade) : linhaTecnica(el, c),
    }
  })
  return { altura: alturaDoDocumento(), largura: document.documentElement.clientWidth, marcas }
}

/** Um path para todas as caixas (tracejadas) e outro para as cotas dos vazios. Traço de 1 px nítido. */
function desenhar(marcas: Marca[]) {
  let caixas = ''
  let cotas = ''
  for (const m of marcas) {
    const x = Math.round(m.x) + 0.5
    const y = Math.round(m.y) + 0.5
    const w = Math.max(0, Math.round(m.w) - 1)
    const h = Math.max(0, Math.round(m.h) - 1)
    caixas += `M${x} ${y}h${w}v${h}h${-w}Z`
    if (m.vazio && w > 12) {
      // a cota da largura, perto da base do vazio (o chip ocupa o topo, por dentro)
      const cy = y + (h >= 80 ? h - 12 : Math.floor(h / 2))
      cotas += `M${x} ${cy}h${w}M${x} ${cy - 3}v6M${x + w} ${cy - 3}v6`
    }
  }
  return { caixas, cotas }
}

/** Área de interseção de dois retângulos (0 se não se tocam). */
function cruza(a: Caixa, b: Caixa): number {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
  return w > 0 && h > 0 ? w * h : 0
}

/**
 * Onde cada chip pousa. O do vazio fica por dentro, no canto (ali não há nada para cobrir). Os outros
 * preferem o canto superior esquerdo, por fora da caixa — é onde a leitura liga o chip ao elemento. As
 * alternativas (ao lado, para elementos baixos como botões; acima à direita; abaixo) só vencem quando
 * cobrem bem menos conteúdo medido. Um chip nunca encosta em outro (desce até ficar livre), nunca sai
 * da largura e nunca começa na faixa do header fixo.
 */
function posicionarChips(marcas: Marca[], tamanhos: { w: number; h: number }[], largura: number, topo: number) {
  const conteudo = marcas.filter(m => !m.vazio)
  const postos: Caixa[] = []
  const saida: { x: number; y: number }[] = new Array(marcas.length)
  const ordem = marcas.map((_, i) => i).sort((a, b) => marcas[a].y - marcas[b].y || marcas[a].x - marcas[b].x)
  for (const i of ordem) {
    const m = marcas[i]
    const { w, h } = tamanhos[i]
    // [x, y, penalidade em px² — a preferência de leitura]
    const opcoes: [number, number, number][] = m.vazio
      ? [[m.x + 8, m.y + 8, 0]]
      : [
          [m.x, m.y - h + 1, 0],
          ...(m.h <= 64 && m.w <= 400 ? [[m.x + m.w + 8, m.y + (m.h - h) / 2, 800] as [number, number, number]] : []),
          [m.x + m.w - w, m.y - h + 1, 6000],
          [m.x, m.y + m.h - 1, 6000],
        ]
    let melhor = { x: 0, y: 0 }
    let menor = Infinity
    for (const [ox, oy, penalidade] of opcoes) {
      const x0 = Math.round(Math.max(0, Math.min(ox, largura - w)))
      const y0 = Math.round(Math.max(topo, oy))
      let x = x0
      let y = y0
      // encostou em outro chip: anda para a direita, se ainda couber sobre a própria caixa; senão, desce
      for (let k = 0; k < LIMITE; k++) {
        const outro = postos.find(p => cruza(p, { x, y, w, h }) > 0)
        if (!outro) break
        const aDireita = outro.x + outro.w + 4
        if (aDireita + w <= Math.min(largura, Math.max(m.x + m.w, x0 + w))) x = aDireita
        else y = outro.y + outro.h + 2
      }
      const r = { x, y, w, h }
      // conteúdo coberto: o próprio elemento pesa dobrado; as caixas que o contêm não contam (cobrem
      // qualquer opção igualmente)
      const coberto = conteudo.reduce((t, o) => {
        if (o === m) return t + 2 * cruza(o, r)
        const contem = o.x <= m.x && o.y <= m.y && o.x + o.w >= m.x + m.w && o.y + o.h >= m.y + m.h
        return contem ? t : t + cruza(o, r)
      }, 0)
      const custo = coberto + penalidade + (x - x0) * 2 + (y - y0) * 40
      if (custo < menor) {
        menor = custo
        melhor = { x, y }
      }
    }
    postos.push({ ...melhor, w, h })
    saida[i] = melhor
  }
  return saida
}

export function DentroOverlay() {
  const pathname = usePathname()
  const [medicao, setMedicao] = useState<Medicao | null>(null)
  const chips = useRef<(HTMLDivElement | null)[]>([])

  // Ao ligar e a cada troca de rota: mede antes da pintura (a camada aparece já desenhada).
  useLayoutEffect(() => {
    setMedicao(medir())
  }, [pathname])

  // O documento mudou de tamanho (janela, fontes, conteúdo que abre): mede de novo, uma vez, 150 ms depois.
  useEffect(() => {
    let t = 0
    let primeira = true
    const agendar = () => {
      window.clearTimeout(t)
      t = window.setTimeout(() => setMedicao(medir()), ESPERA)
    }
    const ro = new ResizeObserver(() => {
      if (primeira) primeira = false // a notificação inicial do observe() não é mudança
      else agendar()
    })
    ro.observe(document.body)
    // conteúdo montado depois, sem mudar o tamanho do documento, avisa pelo mesmo evento das revelações
    window.addEventListener('gg:reveal', agendar)
    const fontes = document.fonts
    if (fontes?.status === 'loading') fontes.ready.then(agendar)
    fontes?.addEventListener?.('loadingdone', agendar)
    return () => {
      window.clearTimeout(t)
      ro.disconnect()
      window.removeEventListener('gg:reveal', agendar)
      fontes?.removeEventListener?.('loadingdone', agendar)
    }
  }, [])

  // Chips: posições decididas antes da pintura, sem nova renderização (o estilo vai direto no nó).
  useLayoutEffect(() => {
    if (!medicao) return
    const topo = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0
    const tamanhos = medicao.marcas.map((_, i) => ({ w: chips.current[i]?.offsetWidth ?? 0, h: chips.current[i]?.offsetHeight ?? 0 }))
    posicionarChips(medicao.marcas, tamanhos, medicao.largura, topo).forEach((p, i) => {
      const el = chips.current[i]
      if (el) el.style.transform = `translate(${p.x}px, ${p.y}px)`
    })
  }, [medicao])

  const d = useMemo(() => (medicao ? desenhar(medicao.marcas) : null), [medicao])

  return (
    <div className={s.camada} style={medicao ? { height: medicao.altura } : undefined} aria-hidden="true">
      <div className={s.colunas} />
      <div className={s.linhas} />
      {medicao && d && (
        <>
          <svg className={s.desenho} width="100%" height={medicao.altura} focusable="false">
            <path className={s.caixas} d={d.caixas} />
            {d.cotas && <path className={s.cotas} d={d.cotas} />}
          </svg>
          {medicao.marcas.map((m, i) => (
            <div
              key={i}
              className={s.chip}
              data-vazio={m.vazio || undefined}
              ref={el => {
                chips.current[i] = el
              }}
            >
              <span className={s.negocio}>{m.negocio}</span>
              <span className={`t-micro ${s.tecnica}`}>{m.tecnica}</span>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
