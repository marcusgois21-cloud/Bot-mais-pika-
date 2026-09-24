import type { Metadata } from 'next'
import { Simbolo } from '@/components/marca/Simbolo'
import { Seta } from '@/components/sistema/Icone'
import { TransitionLink } from '@/components/layout/TransitionLink'
import { VerPorDentroBotao } from '@/components/dentro/VerPorDentroBotao'
import { naoEncontrada as c } from '@/content/copy/sobre'
import s from './nao-encontrada.module.css'

/**
 * 404 nunca é indexada (spec §18.1). O Next já injeta `noindex` nas respostas 404, mas o layout declara
 * `index, follow` em produção: sem este `robots`, a página herdaria as duas instruções em conflito.
 */
export const metadata: Metadata = { title: c.meta.title, robots: { index: false, follow: false } }

/**
 * 404 (spec §14.9). Uma faixa de hero reduzida (50svh) com o corte em repouso e só a grade — versão
 * estática, em CSS, sem depender do hero nem de JS —, a anotação única, o texto, os caminhos e o botão
 * "Ver esta página por dentro". Ligado o modo, o corte vai para a margem esquerda, como na Home.
 *
 * Nenhum elemento do conteúdo leva data-dentro: "nenhum elemento para medir" continua verdade na vista
 * por dentro, que mostra aqui só a grade, as linhas de base e o vazio.
 */
export default function NaoEncontrada() {
  return (
    <>
      <section className={s.faixa} aria-labelledby="nao-encontrada-titulo">
        {/* z0: a grade, à direita do corte (recortada por dois translates opostos) */}
        <div className={`${s.camada} ${s.estrutura}`} aria-hidden="true" data-decorativo>
          <div className={s.clipX}>
            <div className={s.innerX}>
              <div className={s.grade} />
            </div>
          </div>
        </div>

        {/* z1: o título, sólido */}
        <div className={`grid ${s.conteudo}`}>
          <h1 id="nao-encontrada-titulo" className={`t-display-xl ${s.titulo}`}>
            {c.h1}
          </h1>
        </div>

        {/* z2: a linha do corte saindo da fenda do símbolo, e a anotação */}
        <div className={`${s.camada} ${s.corte}`}>
          <div className={s.corteX}>
            <span className={s.alca} aria-hidden="true" data-decorativo>
              <Simbolo tamanho={24} />
            </span>
            <span className={s.linha} aria-hidden="true" data-decorativo />
            <p className={s.anotacao}>
              <span className={`t-small ${s.principal}`}>{c.anotacao.principal}</span>{' '}
              <span className={`t-micro ${s.tecnica}`}>{c.anotacao.tecnica}</span>
            </p>
          </div>
        </div>
      </section>

      <div className={`grid ${s.seguir}`}>
        <p className={`t-lead c-2 ${s.texto}`}>{c.texto}</p>
        <nav className={s.caminhos} aria-label={c.caminhos}>
          <ul>
            {c.links.map(link => (
              <li key={link.href} className={s.caminho}>
                <TransitionLink href={link.href} className={s.link}>
                  <span className={`t-title ${s.linkTexto}`}>{link.texto}</span>
                  <Seta className={s.seta} />
                </TransitionLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className={s.dentro}>
          <VerPorDentroBotao variante="secundario" />
        </div>
        <div className={s.vazio} data-dentro-vazio aria-hidden="true" />
      </div>
    </>
  )
}
