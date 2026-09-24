import type { CSSProperties } from 'react'
import { Rotulo } from '@/components/sistema/Rotulo'
import { Seta } from '@/components/sistema/Icone'
import { Txt } from '@/components/sistema/Txt'
import { TransitionLink } from '@/components/layout/TransitionLink'
import { oQueConstruimos as copy, type Estrutura } from '@/content/copy/home-narrativa'
import { isValidar, texto } from '@/lib/conteudo'
import { IS_PRODUCTION } from '@/lib/env'
import { NBSP, porExtenso } from '@/lib/formatar'
import styles from './OQueConstruimos.module.css'

/** Escalonamento das hairlines: --stagger por linha, até --stagger-max (tokens; 0 com movimento reduzido). */
const escalonar = (i: number) =>
  ({ '--reveal-delay': `min(calc(var(--stagger) * ${i}), var(--stagger-max))` }) as CSSProperties

/**
 * Uma oferta ainda não confirmada (nome em `validar()`) só entra no site publicado depois de aprovada.
 * Fora de produção ela aparece, marcada, para o cliente revisar. O número do título conta só o que entra.
 */
function linhaAprovada(e: Estrutura): boolean {
  return !IS_PRODUCTION || !isValidar(e.nome) || e.nome.aprovado
}

/**
 * 02 · O que construímos (spec §8). Sem cards e sem ícones: um <ol> de linhas, cada uma com <h3> e <dl>.
 * Desktop: nome 1–3 · para quê + inclui 4–8 · "Pronto quando" 9–11 · seta 12. A linha inteira é clicável
 * (o link se estende sobre ela) e o link tem o nome acessível completo.
 */
export function OQueConstruimos() {
  const linhas = copy.estruturas.filter(linhaAprovada)
  const n = linhas.length
  const titulo = copy.titulo(porExtenso(n, true), n)

  return (
    <section id="o-que-construimos" className="secao" aria-labelledby="o-que-construimos-titulo">
      <div className={`grid ${styles.grade}`}>
        <Rotulo>{copy.rotulo}</Rotulo>

        <h2
          id="o-que-construimos-titulo"
          className={`t-display-l ${styles.titulo}`}
          data-reveal="corte"
          data-dentro="Título da seção: o número é contado da lista"
        >
          {titulo}
        </h2>

        <div className={styles.vazio} data-dentro-vazio aria-hidden="true" />
        <p className={`t-lead ${styles.lead}`} data-reveal="fade" data-dentro="Texto de apoio">
          {copy.lead}
        </p>

        <ol className={styles.linhas} data-dentro="Lista do que se contrata: cada linha inteira é clicável">
          {linhas.map((e, i) => (
            <li key={e.id} className={styles.linha}>
              <span className={styles.hairline} data-reveal="linha" style={escalonar(i)} aria-hidden="true" />

              <div className={styles.nomeCelula}>
                <h3 className={`t-display-m ${styles.nome}`}>
                  <Txt t={e.nome} />
                </h3>
              </div>

              <dl className={styles.detalhes}>
                <div className={styles.paraQue}>
                  <dt className="sr-only">{copy.rotuloParaQue}</dt>
                  <dd className="t-lead">{e.paraQue}</dd>
                </div>
                <div className={styles.inclui}>
                  <dt className="sr-only">{copy.rotuloInclui}</dt>
                  <dd className="t-small c-2">
                    <ul className={styles.itens}>
                      {e.inclui.map((item, j) => (
                        <li key={texto(item)}>
                          <Txt t={item} />
                          {j < e.inclui.length - 1 && (
                            <span className={styles.separador} aria-hidden="true">
                              {/* espaço sem quebra antes do ponto: a linha nunca começa num separador */}
                              {`${NBSP}· `}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
                <div className={styles.pronto}>
                  <dt className={`t-small ${styles.prontoRotulo}`}>{copy.rotuloProntoQuando}</dt>
                  <dd className={`t-body ${styles.prontoCriterio}`}>
                    <Txt t={e.prontoQuando} />
                  </dd>
                </div>
              </dl>

              <TransitionLink href={e.link.href} className={styles.acao}>
                <span className={styles.acaoTexto}>{e.link.texto}</span>
                <Seta className={styles.seta} />
              </TransitionLink>
            </li>
          ))}
        </ol>
        <span className={styles.fechoLinha} data-reveal="linha" style={escalonar(n)} aria-hidden="true" />

        <p className={`t-body c-2 ${styles.fecho}`} data-reveal="fade" data-dentro="Texto de apoio">
          {copy.fecho}{' '}
          <TransitionLink href={copy.fechoLink.href} className={`link ${styles.fechoLink}`}>
            {copy.fechoLink.texto}
            <Seta dir="baixo" />
          </TransitionLink>
        </p>
      </div>
    </section>
  )
}
