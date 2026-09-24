import type { CSSProperties } from 'react'
import { Rotulo } from '@/components/sistema/Rotulo'
import { Seta } from '@/components/sistema/Icone'
import { TransitionLink } from '@/components/layout/TransitionLink'
import { quemE as copy } from '@/content/copy/home-narrativa'
import styles from './QuemE.module.css'

const atraso = (ms: number) => ({ '--reveal-delay': `${ms}ms` }) as CSSProperties

/**
 * 01 · Quem é (spec §8). Fixa, numa leitura, "empresa de desenvolvimento de sites e estrutura digital".
 * Desktop: título 1–9; lead 5–10 e corpo 5–9 com o vazio medido em 1–4; três afirmações em 1–4, 5–8 e
 * 9–12, cada uma sob uma hairline que se desenha da esquerda para a direita; link em 5–8.
 * Tablet: afirmações viram linhas (termo 1–3, texto 4–8). Mobile: empilhado.
 */
export function QuemE() {
  return (
    <section id="quem-e" className="secao" aria-labelledby="quem-e-titulo">
      <div className={`grid ${styles.grade}`}>
        <Rotulo>{copy.rotulo}</Rotulo>

        <h2 id="quem-e-titulo" className={`t-display-l ${styles.titulo}`} data-reveal="corte" data-dentro="Título da seção">
          {copy.titulo}
        </h2>

        <div className={styles.vazio} data-dentro-vazio aria-hidden="true" />

        <p className={`t-lead ${styles.lead}`} data-reveal="fade" data-dentro="Texto de apoio">
          {copy.lead}
        </p>
        <p className={`t-body c-2 ${styles.corpo}`} data-reveal="fade" style={atraso(160)} data-dentro="Texto de apoio">
          {copy.corpo}
        </p>

        <ul className={styles.afirmacoes} data-dentro="Três afirmações: superfície, estrutura e função">
          {copy.afirmacoes.map((a, i) => (
            <li key={a.termo} className={styles.afirmacao}>
              <span className={styles.hairline} data-reveal="linha" style={atraso(i * 60)} aria-hidden="true" />
              <div className={styles.afirmacaoTexto} data-reveal="fade" style={atraso(120 + i * 60)}>
                <h3 className={`t-title ${styles.termo}`}>{a.termo}</h3>
                <p className={`t-body c-2 ${styles.explica}`}>{a.texto}</p>
              </div>
            </li>
          ))}
        </ul>

        <p className={styles.acao} data-reveal="fade">
          <TransitionLink href={copy.link.href} className="link" data-dentro="Link para o Sobre">
            {copy.link.texto}
            <Seta />
          </TransitionLink>
        </p>
      </div>
    </section>
  )
}
