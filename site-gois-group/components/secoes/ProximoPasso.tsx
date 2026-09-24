import type { CSSProperties } from 'react'
import { Rotulo } from '@/components/sistema/Rotulo'
import { Seta } from '@/components/sistema/Icone'
import { Txt } from '@/components/sistema/Txt'
import { Botao } from '@/components/sistema/Botao'
import { TransitionLink } from '@/components/layout/TransitionLink'
import { proximoPasso as copy } from '@/content/copy/home-narrativa'
import styles from './ProximoPasso.module.css'

/** Escalonamento das hairlines: --stagger por linha, até --stagger-max (tokens; 0 com movimento reduzido). */
const escalonar = (i: number) =>
  ({ '--reveal-delay': `min(calc(var(--stagger) * ${i}), var(--stagger-max))` }) as CSSProperties

/**
 * 08 · Próximo passo (spec §8). Título 1–10, corpo 1–6, quatro entradas em 1–8 (vazio medido em 9–12):
 * cada entrada é uma linha inteira clicável, com no mínimo 64 px, hairline superior e seta em SVG.
 * Fecha com o botão primário, o único magnético desta página além do hero (spec §17).
 */
export function ProximoPasso() {
  return (
    <section id="proximo-passo" className="secao" aria-labelledby="proximo-passo-titulo">
      <div className={`grid ${styles.grade}`}>
        <Rotulo>{copy.rotulo}</Rotulo>

        <h2 id="proximo-passo-titulo" className={`t-display-xl ${styles.titulo}`} data-reveal="corte" data-dentro="Título da seção">
          {copy.titulo}
        </h2>

        <p className={`t-lead c-2 ${styles.corpo}`} data-reveal="fade" data-dentro="Texto de apoio">
          <Txt t={copy.corpo} />
        </p>

        <ul className={styles.entradas} data-dentro="Quatro entradas: cada linha inteira é clicável">
          {copy.entradas.map((e, i) => (
            <li key={e.href} className={styles.entrada}>
              <span className={styles.hairline} data-reveal="linha" style={escalonar(i)} aria-hidden="true" />
              <TransitionLink href={e.href} className={styles.link}>
                <span className={`t-title ${styles.entradaTitulo}`}>{e.titulo}</span>{' '}
                <span className={`t-small ${styles.apoio}`}>{e.apoio}</span>
                <Seta className={styles.seta} />
              </TransitionLink>
            </li>
          ))}
        </ul>
        <span className={styles.fechoLinha} data-reveal="linha" style={escalonar(copy.entradas.length)} aria-hidden="true" />

        <div className={styles.vazio} data-dentro-vazio aria-hidden="true" />

        <div className={styles.acao} data-reveal="fade">
          <Botao href={copy.botao.href} magnetico seta data-dentro="Botão principal">
            {copy.botao.texto}
          </Botao>
        </div>
      </div>
    </section>
  )
}
