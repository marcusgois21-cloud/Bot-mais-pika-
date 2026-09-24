'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { mq } from '@/lib/breakpoints'
import { Seta } from '@/components/sistema/Icone'
import s from './Trilho.module.css'

export type FaseTrilho = {
  /** prefixo dos ids do botão e do painel */
  id: string
  codigo: string
  nome: string
  verbo: string
  /** conteúdo do painel, renderizado no servidor */
  painel: ReactNode
}

/**
 * O trilho do Método Prumo (spec §10). Um DOM só: `<ol>`; cada `<li>` tem `<h3><button></button></h3>`
 * + `<div role="region" aria-labelledby>`.
 *
 * - ≥ 900 px (com JS): trilho horizontal; as fases são disclosures EXCLUSIVAS (abrir uma fecha a outra),
 *   trocadas só por clique ou Enter/Espaço, nunca por hover. Todos os painéis ocupam a mesma célula da
 *   grade: a área tem a altura do maior painel e a troca é um crossfade (os fechados ficam
 *   `visibility: hidden`, fora da árvore de acessibilidade). A fase aberta não recolhe
 *   (`aria-disabled`, padrão accordion da APG).
 * - < 900 px: trilho vertical; disclosures INDEPENDENTES. O JS lê `matchMedia` só para esse comportamento.
 * - Sem JS: todos os painéis visíveis, em sequência (as regras que escondem existem só sob `html.js`).
 *
 * A entrada (a linha que se desenha) usa o RevealObserver da fundação: `data-reveal="trilho"` recebe
 * `data-revelado` ao entrar na tela; a coreografia é só CSS (Trilho.module.css).
 */
export function Trilho({
  fases,
  rotuloLaco,
  notaLaco,
  dentro,
}: {
  fases: FaseTrilho[]
  rotuloLaco: string
  notaLaco: string
  dentro: { lista: string; laco: string }
}) {
  // ordem de abertura: a última é a mais recente (é a que fica quando o layout vira exclusivo)
  const [abertas, setAbertas] = useState<number[]>([0])
  const [exclusivo, setExclusivo] = useState(false)
  const [montado, setMontado] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(mq.md)
    const aplicar = () => {
      setExclusivo(mql.matches)
      if (mql.matches) setAbertas(a => [a.length ? a[a.length - 1] : 0])
    }
    aplicar()
    setMontado(true)
    mql.addEventListener('change', aplicar)
    return () => mql.removeEventListener('change', aplicar)
  }, [])

  function alternar(i: number) {
    setAbertas(a => {
      if (exclusivo) return a.length === 1 && a[0] === i ? a : [i]
      return a.includes(i) ? a.filter(x => x !== i) : [...a, i]
    })
  }

  return (
    <div className={s.trilho} data-reveal="trilho">
      <p className={`t-small ${s.lacoRotulo}`}>{rotuloLaco}</p>
      <div className={s.laco} aria-hidden="true" data-dentro={dentro.laco}>
        <span className={s.lacoSobe} />
        <span className={s.lacoCorre} />
        <span className={s.lacoDesce} />
        <Seta dir="baixo" tamanho={8} className={s.lacoPonta} />
      </div>

      <ol className={s.fases} data-dentro={dentro.lista}>
        {fases.map((f, i) => {
          const aberta = abertas.includes(i)
          return (
            <li key={f.id} className={s.fase} data-aberta={aberta || undefined}>
              <h3 className={s.titulo}>
                <button
                  type="button"
                  id={`${f.id}-botao`}
                  className={s.botao}
                  aria-controls={`${f.id}-painel`}
                  // sem JS (antes da montagem) todos os painéis estão visíveis
                  aria-expanded={montado ? aberta : true}
                  aria-disabled={exclusivo && aberta ? true : undefined}
                  onClick={() => alternar(i)}
                >
                  <span className={`t-label ${s.codigo}`}>{f.codigo}</span>{' '}
                  <span className={`t-title ${s.nome}`}>{f.nome}</span>{' '}
                  <span className={`t-small ${s.verbo}`}>{f.verbo}</span>
                  <Seta dir="baixo" className={s.indicador} />
                </button>
              </h3>
              {/* a marca da fase aberta: vertical de 1 px em Rubrica que atravessa o critério (só no trilho horizontal) */}
              <span className={s.marca} aria-hidden="true" />
              <span className={s.criterio} aria-hidden="true">
                <span className={s.quadrado} />
              </span>
              <div
                id={`${f.id}-painel`}
                role="region"
                aria-labelledby={`${f.id}-botao`}
                className={s.painel}
                data-aberto={aberta || undefined}
              >
                {f.painel}
              </div>
            </li>
          )
        })}
      </ol>

      <p className={`t-small ${s.nota}`}>
        <Seta dir="cima" className={s.notaSeta} />
        <span>{notaLaco}</span>
      </p>
    </div>
  )
}
