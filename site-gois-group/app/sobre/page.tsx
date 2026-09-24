import type { CSSProperties } from 'react'
import type { Metadata } from 'next'
import { Rotulo } from '@/components/sistema/Rotulo'
import { Txt } from '@/components/sistema/Txt'
import { Botao } from '@/components/sistema/Botao'
import { Seta } from '@/components/sistema/Icone'
import { JsonLd } from '@/components/sistema/JsonLd'
import { DadoPendente } from '@/components/sistema/DadoPendente'
import { TransitionLink } from '@/components/layout/TransitionLink'
import { VerPorDentroBotao } from '@/components/dentro/VerPorDentroBotao'
import { sobre as c } from '@/content/copy/sobre'
import { metodo } from '@/content/metodo'
import { site } from '@/content/site'
import { SHOW_PENDING } from '@/lib/env'
import { isPending, known } from '@/lib/pending'
import { breadcrumbLd, pageMetadata } from '@/lib/seo'
import s from './sobre.module.css'

export const metadata: Metadata = pageMetadata({ title: c.meta.title, description: c.meta.description, path: '/sobre/' })

const atraso = (ms: number) => ({ '--reveal-delay': `${ms}ms` }) as CSSProperties
/** Escalonamento por item: --stagger por posição, até --stagger-max (0 com movimento reduzido). */
const escalonar = (i: number) =>
  ({ '--reveal-delay': `min(calc(var(--stagger) * ${i}), var(--stagger-max))` }) as CSSProperties

/** "Ana", "Ana e Bruno", "Ana, Bruno e Carla". */
function emLista(nomes: readonly string[]): string {
  return nomes.length <= 1 ? (nomes[0] ?? '') : `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`
}

/** Rótulo de seção que é o título dela (h2): Archivo 500, --text-3, ao lado do texto no desktop. */
function Titulo({ id, children }: { id: string; children: string }) {
  return (
    <h2 id={id} className={`t-eyebrow secao__rotulo ${s.rotulo}`}>
      {children}
    </h2>
  )
}

/** Uma seção do Sobre: hairline no topo, rótulo ao lado (≥ 900) e o vazio medido sob o rótulo. */
function Secao({
  id,
  rotulo,
  alinha,
  vazio = true,
  className,
  children,
}: {
  id: string
  rotulo: string
  className?: string
  /** alinha a linha de base do rótulo com a primeira linha do texto ao lado */
  alinha: 'lead' | 'titulo' | 'display'
  vazio?: boolean
  children: React.ReactNode
}) {
  return (
    <section className="secao" aria-labelledby={id}>
      <div className={`grid ${s.lado} ${s[`alinha-${alinha}`]} ${className ?? ''}`}>
        <Titulo id={id}>{rotulo}</Titulo>
        {children}
        {vazio && <div className={s.vazio} data-dentro-vazio aria-hidden="true" />}
      </div>
    </section>
  )
}

/**
 * 06 · Registro: tabela Ano · Marco, só com pelo menos um marco real (spec §14.6). Em homologação, as três
 * instruções — fundação, fundadores, marcos — no lugar do que ainda não foi informado. Nada é simulado.
 */
function Registro() {
  const fundacao = known(site.fundacao)
  const fundadores = known(site.fundadores)
  const marcos = known(site.marcos) ?? []
  if (!fundacao && !marcos.length && !SHOW_PENDING) return null

  const r = c.registro
  const mostrarFundacao = Boolean(fundacao) || (SHOW_PENDING && isPending(site.fundacao))
  return (
    <Secao id="registro" rotulo={r.rotulo} alinha="lead">
      <div className={s.corpo} data-reveal="fade">
        <table className={s.tabela} data-dentro="Tabela: ano e marco">
          <caption className="sr-only">{r.legenda}</caption>
          <thead>
            <tr>
              <th scope="col" className="t-small c-3">
                {r.colunas.ano}
              </th>
              <th scope="col" className="t-small c-3">
                {r.colunas.marco}
              </th>
            </tr>
          </thead>
          <tbody className="t-lead">
            {mostrarFundacao && (
              <tr>
                <th scope="row">{fundacao ?? (isPending(site.fundacao) && <DadoPendente dado={site.fundacao} />)}</th>
                <td>
                  {r.fundacao}
                  {fundadores?.length ? `, ${r.por} ${emLista(fundadores)}` : null}
                  {SHOW_PENDING && isPending(site.fundadores) && (
                    <>
                      , {r.por} <DadoPendente dado={site.fundadores} />
                    </>
                  )}
                </td>
              </tr>
            )}
            {marcos.map(m => (
              <tr key={`${m.ano}-${m.marco}`}>
                <th scope="row">{m.ano}</th>
                <td>{m.marco}</td>
              </tr>
            ))}
            {SHOW_PENDING && isPending(site.marcos) && (
              <tr>
                <td colSpan={2}>
                  <DadoPendente dado={site.marcos} />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Secao>
  )
}

/**
 * /sobre/ (spec §14.6): não é um "sobre nós" — é por que a empresa existe, no que acredita e como trabalha.
 * Topo (H1 e lead, sólidos no primeiro paint), manifesto revelado verso a verso com o botão "Ver esta
 * página por dentro", as sete partes com o rótulo ao lado do texto no desktop, e o fecho com o CTA
 * primário magnético (spec §17).
 */
export default function Sobre() {
  return (
    <>
      <JsonLd data={breadcrumbLd([{ nome: c.rotulo, path: '/sobre/' }])} />

      <section className={`secao secao--sem-linha ${s.topo}`} aria-labelledby="sobre-titulo">
        <div className={`grid ${s.gradeTopo}`}>
          <Rotulo>{c.rotulo}</Rotulo>
          <h1 id="sobre-titulo" className={`t-display-l ${s.titulo}`} data-dentro="Título da página">
            {c.h1}
          </h1>
          <div className={s.vazioTopo} data-dentro-vazio aria-hidden="true" />
          <p className={`t-lead c-2 ${s.lead}`} data-dentro="Texto de apoio">
            {c.lead}
          </p>
        </div>
      </section>

      {/* Manifesto (spec §3): um verso por linha, revelados por corte, 80 ms entre eles. */}
      <Secao id="manifesto" rotulo={c.manifesto.rotulo} alinha="titulo" className={s.manifesto}>
        <div className={s.corpo}>
          <p className={`t-title ${s.versos}`} data-dentro="Manifesto: seis versos, um por linha">
            {c.manifesto.versos.map((verso, i) => (
              <span key={verso} className={s.verso} data-reveal="corte" style={atraso(i * 80)}>
                {verso}{' '}
              </span>
            ))}
          </p>
          <div className={s.acaoDentro} data-reveal="fade" style={atraso(480)}>
            <span className={s.botaoDentro} data-dentro="Botão: esta página por dentro">
              <VerPorDentroBotao variante="secundario" />
            </span>
          </div>
        </div>
      </Secao>

      <Secao id="por-que-existimos" rotulo={c.porQue.rotulo} alinha="lead">
        <p className={`t-lead ${s.corpo}`} data-reveal="fade" data-dentro="Por que a empresa existe">
          {c.porQue.texto.map((t, i) => (
            <Txt key={i} t={t} />
          ))}
        </p>
      </Secao>

      <Secao id="visao" rotulo={c.visao.rotulo} alinha="display">
        <p className={`t-display-m ${s.corpo} ${s.declaracao}`} data-reveal="corte" data-dentro="Visão, em uma frase">
          {c.visao.texto}
        </p>
      </Secao>

      <Secao id="conviccoes" rotulo={c.conviccoes.rotulo} alinha="titulo">
        <ol className={`${s.corpo} ${s.conviccoes}`} data-dentro="Convicções, numeradas">
          {c.conviccoes.itens.map((item, i) => (
            <li key={item.afirmacao} className={s.conviccao} data-reveal="fade" style={escalonar(i)}>
              <span className={`t-title ${s.numero}`} aria-hidden="true">
                {i + 1}
              </span>
              <h3 className={`t-title ${s.afirmacao}`}>{item.afirmacao}</h3>
              <p className={`t-body c-2 ${s.explicacao}`}>{item.explicacao}</p>
            </li>
          ))}
        </ol>
      </Secao>

      {/* Modelo: as três formas sobre o mesmo trilho do Método — o trecho que cada uma cobre. */}
      <Secao id="modelo" rotulo={c.modelo.rotulo} alinha="display" vazio={false}>
        <p className={`t-display-m ${s.corpo}`} data-reveal="fade" data-dentro="Texto de apoio">
          <Txt t={c.modelo.intro} />
        </p>
        <div className={s.modelo} data-dentro="Três formas sobre o trilho do método">
          <ol className={s.fases} aria-hidden="true" data-reveal="fade">
            {metodo.fases.map(f => (
              <li key={f.codigo} className={s.fase}>
                <span className={`t-label ${s.faseCodigo}`}>{f.codigo}</span>
                <span className={`t-small ${s.faseNome}`}>{f.nome}</span>
              </li>
            ))}
          </ol>
          <ul className={s.formas}>
            {c.modelo.formas.map((f, i) => (
              <li key={f.id} className={s.forma} data-reveal="fade" style={escalonar(i + 1)}>
                <div className={s.formaTexto}>
                  <h3 className={`t-title ${s.formaNome}`}>{f.nome}</h3>
                  <p className={`t-small c-2 ${s.formaDesc}`}>
                    <Txt t={f.texto} />
                  </p>
                </div>
                <div className={s.trilho} style={{ '--de': f.de } as CSSProperties}>
                  {metodo.fases.map((_, n) => {
                    const fase = n + 1
                    const cobre = fase >= f.de && fase <= f.ate
                    return (
                      <span
                        key={fase}
                        className={s.seg}
                        aria-hidden="true"
                        data-cobre={cobre || undefined}
                        data-ini={fase === f.de || undefined}
                        data-fim={fase === f.ate || undefined}
                      >
                        {'laco' in f && fase === f.ate && (
                          <span className={s.laco}>
                            <svg viewBox="0 0 9 6" width={9} height={6} className={s.lacoSeta} focusable="false">
                              <path d="M.5 .5L4.5 5L8.5 .5" />
                            </svg>
                          </span>
                        )}
                      </span>
                    )
                  })}
                  <p className={`t-micro ${s.codigos}`} data-laco={'laco' in f || undefined}>
                    <span aria-hidden="true">{f.codigos}</span>
                    <span className="sr-only">{f.leitura}</span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Secao>

      <Secao id="como-pensamos" rotulo={c.comoPensamos.rotulo} alinha="lead">
        <div className={s.corpo}>
          <p className="t-lead" data-reveal="fade" data-dentro="Texto de apoio">
            {c.comoPensamos.texto}
          </p>
          <p className={s.acao} data-reveal="fade" style={atraso(160)}>
            <TransitionLink href={c.comoPensamos.link.href} className={`link ${s.linkAlvo}`} data-dentro="Link para o método">
              {c.comoPensamos.link.texto}
              <Seta />
            </TransitionLink>
          </p>
        </div>
      </Secao>

      <Registro />

      <Secao id="o-que-vem" rotulo={c.oQueVem.rotulo} alinha="lead">
        <p className={`t-lead ${s.corpo}`} data-reveal="fade" data-dentro="O que vem">
          {c.oQueVem.texto}
        </p>
      </Secao>

      <section className="secao" aria-labelledby="fecho">
        <div className={`grid ${s.gradeFecho}`}>
          <h2 id="fecho" className={`t-display-m ${s.fecho}`} data-reveal="corte" data-dentro="Convite">
            {c.fecho.texto}
          </h2>
          <div className={s.fechoAcao} data-reveal="fade" style={atraso(160)}>
            <Botao href={c.fecho.cta.href} magnetico seta data-dentro="Botão principal">
              {c.fecho.cta.texto}
            </Botao>
          </div>
          <div className={s.fechoVazio} data-dentro-vazio aria-hidden="true" />
        </div>
      </section>
    </>
  )
}
