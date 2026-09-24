import type { CSSProperties } from 'react'
import { Rotulo } from '@/components/sistema/Rotulo'
import { visao as copy } from '@/content/copy/home-narrativa'
import styles from './Visao.module.css'

const atraso = (ms: number) => ({ '--reveal-delay': `${ms}ms` }) as CSSProperties

/**
 * 06 · Visão (spec §8): a única seção em papel, a mudança de iluminação da Home.
 * O papel entra por corte, da esquerda para a direita, preso ao scroll — só com transforms, no compositor:
 * .clip vai de translateX(-100%) a 0 e .inner de translateX(100%) a 0 (o conteúdo fica parado; só a
 * borda do papel anda). Sem suporte a scroll-driven ou com movimento reduzido: papel estático, troca seca.
 * O header troca de tom sozinho sobre [data-surface="papel"].
 */
export function Visao() {
  return (
    <section id="visao" className={styles.visao} data-surface="papel" aria-labelledby="visao-titulo">
      <div className={styles.clip}>
        <div className={`grid ${styles.inner}`}>
          <Rotulo>{copy.rotulo}</Rotulo>

          <h2 id="visao-titulo" className={`t-display-xl ${styles.titulo}`} data-reveal="corte" data-dentro="Título da seção">
            {copy.titulo}
          </h2>

          <div className={styles.vazio} data-dentro-vazio aria-hidden="true" />
          <div className={styles.paragrafos} data-dentro="Texto da visão">
            {copy.paragrafos.map((p, i) => (
              <p key={i} className="t-lead" data-reveal="fade" style={atraso(80 + i * 80)}>
                {p}
              </p>
            ))}
          </div>

          <p className={`t-display-m ${styles.fecho}`} data-reveal="corte" data-dentro="Frase de assinatura do método">
            {copy.fecho}
          </p>
        </div>
      </div>
    </section>
  )
}
