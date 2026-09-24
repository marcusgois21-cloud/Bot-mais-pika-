import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { CapitulosCase, ContinuidadeTitulo, type ItemCapitulo } from '@/components/cases/CapitulosCase'
import { MetricasBuild } from '@/components/cases/MetricasBuild'
import { TabelaMetricas } from '@/components/cases/TabelaMetricas'
import { TransitionLink } from '@/components/layout/TransitionLink'
import { Botao } from '@/components/sistema/Botao'
import { Dado, DadoPendente } from '@/components/sistema/DadoPendente'
import { Icone, Seta } from '@/components/sistema/Icone'
import { Status } from '@/components/sistema/StatusMarcador'
import { JsonLd } from '@/components/sistema/JsonLd'
import { casos, CAPITULOS } from '@/content/cases'
import { empresas } from '@/content/empresas'
import { empresaDoCase, metricasBuild, paginaCase, paginaCases, seoCases } from '@/content/copy/cases'
import { ESCOPO_ROTULO, publicada, visivel, type Case, type MetricaCase } from '@/lib/conteudo'
import { isPending, known } from '@/lib/pending'
import { BUILD_DATE, SHOW_PENDING } from '@/lib/env'
import { dataCurta, NBSP } from '@/lib/formatar'
import { breadcrumbLd, creativeWorkLd, pageMetadata } from '@/lib/seo'
import styles from './case.module.css'

/**
 * /cases/[slug]/ (spec §14.5): o case em 7 capítulos, com índice fixo no desktop.
 * Gerada só para cases publicados; em homologação também para os placeholders — páginas-modelo,
 * com noindex e a faixa "PÁGINA-MODELO — NÃO PUBLICADA".
 * /cases/este-site/ é o Case Nº 000: as métricas vêm de /metrics.json, gravado a cada build.
 */
export const dynamicParams = false

type Params = { params: Promise<{ slug: string }> }

const visiveis = () => casos.filter(visivel)

export function generateStaticParams() {
  return visiveis().map(c => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const c = visiveis().find(x => x.slug === slug)
  if (!c) return {}
  const path = `/cases/${c.slug}/`
  if (c.placeholder) {
    return pageMetadata({
      title: seoCases.modelo.titulo(c.numero),
      description: seoCases.modelo.description,
      path,
      type: 'article',
      noindex: true,
    })
  }
  return pageMetadata({
    title: seoCases.titulo(known(c.titulo) ?? paginaCase.codigo(c.numero), c.numero),
    description: seoCases.descricoes[c.slug] ?? known(c.tese) ?? '',
    path,
    type: 'article',
  })
}

export default async function PaginaCase({ params }: Params) {
  const { slug } = await params
  const lista = visiveis()
  const i = lista.findIndex(x => x.slug === slug)
  if (i < 0) notFound()
  const c = lista[i]
  const proximo = lista[i + 1]
  const path = `/cases/${c.slug}/`
  const empresa = empresaDoCase(c, empresas)
  const empresaHref = hrefDaEmpresa(c)

  const itens: ItemCapitulo[] = CAPITULOS.map((cap, n) => ({
    id: paginaCase.ancoras[cap.chave],
    numero: String(n + 1).padStart(2, '0'),
    titulo: cap.titulo,
  }))

  const ld: object[] = [
    breadcrumbLd([
      { nome: paginaCases.rotulo, path: '/cases/' },
      { nome: known(c.titulo) ?? paginaCase.codigo(c.numero), path },
    ]),
  ]
  const titulo = known(c.titulo)
  const tese = known(c.tese)
  if (publicada(c) && titulo && tese) {
    const inicio = isPending(c.periodo) ? undefined : known(c.periodo.inicio)
    ld.push(creativeWorkLd({ nome: titulo, about: tese, path, dateCreated: inicio }))
  }

  return (
    <>
      <JsonLd data={ld} />

      {c.placeholder && (
        <div className={styles.faixa} role="note">
          <p className="t-label">{paginaCase.faixaModelo}</p>
        </div>
      )}

      <div className={`grid ${styles.topo} ${c.placeholder ? styles.topoModelo : ''}`}>
        <nav className={styles.trilha} aria-label={paginaCase.trilha}>
          <ol>
            <li>
              <TransitionLink href="/cases/" className="link link--quieto t-small c-2">
                {paginaCases.rotulo}
              </TransitionLink>
              <span className={`t-small ${styles.barra}`} aria-hidden="true">
                /
              </span>
            </li>
            <li aria-current="page">
              <span className="t-label c-3">{paginaCase.codigo(c.numero)}</span>
            </li>
          </ol>
        </nav>

        <h1 id="case-titulo" className={`t-display-l ${styles.h1}`} data-dentro="Título do case">
          <Dado valor={c.titulo} />
        </h1>
        <ContinuidadeTitulo slug={c.slug} alvo="case-titulo" />

        <p className={`t-lead c-2 ${styles.lead}`} data-dentro="A tese do case">
          <Dado valor={c.tese} />
        </p>

        <dl className={styles.meta} data-dentro="Ficha do case">
          <div className={styles.metaItem}>
            <dt className="t-small c-3">{paginaCase.meta.empresa}</dt>
            <dd className="t-body">
              {empresaHref && !isPending(empresa) ? (
                <TransitionLink href={empresaHref} className="link link--quieto">
                  {empresa}
                </TransitionLink>
              ) : (
                <Dado valor={empresa} />
              )}
            </dd>
          </div>
          <div className={styles.metaItem}>
            <dt className="t-small c-3">{paginaCase.meta.estrutura}</dt>
            <dd className="t-body">
              <Dado valor={c.estrutura}>{v => v.map(e => ESCOPO_ROTULO[e]).join(' · ')}</Dado>
            </dd>
          </div>
          <div className={`${styles.metaItem} ${styles.metaPeriodo}`}>
            <dt className="t-small c-3">{paginaCase.meta.periodo}</dt>
            <dd className="t-body">
              <Periodo c={c} />
            </dd>
          </div>
          <div className={styles.metaItem}>
            <dt className="t-small c-3">{paginaCase.meta.status}</dt>
            <dd className={styles.metaStatus}>
              {isPending(c.status) ? <Dado valor={c.status} /> : <Status status={c.status} />}
            </dd>
          </div>
          <div className={styles.metaItem}>
            <dt className="t-small c-3">{paginaCase.meta.site}</dt>
            <dd className="t-body">
              <VerOSite website={c.website} />
            </dd>
          </div>
        </dl>
      </div>

      <div className={`grid ${styles.corpo}`}>
        <div className={styles.indiceCol}>
          <CapitulosCase itens={itens} rotulo={paginaCase.indice.rotulo} aria={paginaCase.indice.aria} />
        </div>

        <div className={styles.conteudo}>
          {CAPITULOS.map((cap, n) => {
            const id = paginaCase.ancoras[cap.chave]
            const [num, nome] = paginaCase.capitulo(n + 1, cap.titulo).split(' — ')
            const revela = n > 0
            return (
              <section key={cap.chave} id={id} className={styles.capitulo} aria-labelledby={`${id}-titulo`}>
                <h2
                  id={`${id}-titulo`}
                  className={`t-display-m ${styles.capTitulo}`}
                  data-reveal={revela ? 'corte' : undefined}
                  data-dentro="Título do capítulo"
                >
                  <span className="c-3">{num} — </span>
                  {nome}
                </h2>
                {cap.chave === 'metricas' ? (
                  <div className={styles.largo}>
                    {c.metricasDoBuild ? (
                      <MetricasBuild
                        copy={metricasBuild}
                        caption={paginaCase.metricas.caption(c.numero)}
                        rotuloRegiao={paginaCase.metricas.regiao}
                      />
                    ) : (
                      <MetricasDoCase c={c} />
                    )}
                  </div>
                ) : (
                  <>
                    <p
                      className={`t-lead ${styles.texto}`}
                      data-reveal={revela ? 'fade' : undefined}
                      data-dentro="Texto do capítulo"
                    >
                      <Dado valor={c.capitulos[cap.chave]} />
                    </p>
                    {cap.chave === 'construcao' && c.stack && c.stack.length > 0 && (
                      <TabelaMetricas
                        className={styles.stack}
                        caption={paginaCase.stack.caption(c.numero)}
                        colunas={paginaCase.stack.colunas}
                        dentro="Tabela de tecnologias"
                        linhas={c.stack.map(s => ({
                          chave: s.tecnologia,
                          cabecalho: <span className="t-body">{s.tecnologia}</span>,
                          celulas: [<span key="p" className="t-body c-2">{s.paraQue}</span>],
                        }))}
                      />
                    )}
                  </>
                )}
              </section>
            )
          })}
        </div>
      </div>

      <section className="secao" aria-label={paginaCase.fim.proximo}>
        <div className={`grid ${styles.fim}`}>
          <div className={styles.fimItem}>
            <p className="t-small c-3">{paginaCase.fim.empresa}</p>
            {empresaHref && !isPending(empresa) ? (
              <TransitionLink href={empresaHref} className={`link link--quieto t-title ${styles.fimLink}`}>
                {empresa}
                <Seta />
              </TransitionLink>
            ) : (
              <p className="t-title">
                <Dado valor={empresa} />
              </p>
            )}
          </div>
          <div className={styles.fimItem}>
            <p className="t-small c-3">{proximo ? paginaCase.fim.proximo : paginaCase.fim.todos}</p>
            {proximo ? (
              <TransitionLink href={`/cases/${proximo.slug}/`} className={`link link--quieto t-title ${styles.fimLink}`}>
                <span className="t-label c-3">{paginaCases.codigo(proximo.numero)}</span>
                <Dado valor={proximo.titulo} />
                <Seta />
              </TransitionLink>
            ) : (
              <TransitionLink href="/cases/" className={`link link--quieto t-title ${styles.fimLink}`}>
                {paginaCase.fim.verTodos}
                <Seta />
              </TransitionLink>
            )}
          </div>
          <div className={styles.fimItem}>
            <p className="t-small c-3">{paginaCase.fim.projeto}</p>
            <Botao href={`/contato/?origem=case-${c.numero}`} seta data-dentro="Botão principal">
              {paginaCase.fim.iniciar}
            </Botao>
          </div>
        </div>
      </section>
    </>
  )
}

/** Página da empresa relacionada, se ela existe; o Nº 000 aponta para o Sobre da própria Gois Group. */
function hrefDaEmpresa(c: Case): string | undefined {
  if (c.empresaSlug) {
    const e = empresas.find(x => x.slug === c.empresaSlug)
    return e && visivel(e) ? `/empresas/${e.slug}/` : undefined
  }
  return c.placeholder ? undefined : paginaCase.empresaPropria.href
}

/**
 * Período. No Nº 000 o fim é a data desta versão publicada. Com o início pendente:
 * homologação mostra a instrução; produção mostra só a data de lançamento (spec §22.1).
 */
function Periodo({ c }: { c: Case }) {
  if (isPending(c.periodo)) return <Dado valor={c.periodo} />
  const { inicio, lancamento } = c.periodo
  const fim = lancamento ?? (c.metricasDoBuild ? dataCurta(BUILD_DATE) : undefined)
  if (isPending(inicio)) {
    if (!SHOW_PENDING) return <>{fim ? paginaCase.somenteLancamento(fim) : '—'}</>
    return (
      <>
        <DadoPendente dado={inicio} />
        {fim && ` ${paginaCase.ate} ${fim}`}
      </>
    )
  }
  return <>{fim ? `${inicio} ${paginaCase.ate} ${fim}` : inicio}</>
}

/** Ver o site: interno por transição; externo com o ícone de link externo e rel="noopener". */
function VerOSite({ website }: { website: Case['website'] }) {
  if (isPending(website)) return <Dado valor={website} />
  if (website.startsWith('/')) {
    return (
      <TransitionLink href={website} className="link link--quieto">
        {paginaCase.verOSite}
        <Seta />
      </TransitionLink>
    )
  }
  return (
    <a href={website} className="link link--quieto" target="_blank" rel="noopener">
      {paginaCase.verOSite}
      <Icone nome="externo" />
    </a>
  )
}

/** Tabela de §12.1: Métrica · Antes · Depois · Variação · Período · Fonte · Método. */
function MetricasDoCase({ c }: { c: Case }) {
  const valor = (v: MetricaCase['antes'], m: MetricaCase): ReactNode =>
    isPending(v) ? <Dado valor={v} /> : `${formatar(v)}${m.unidade ? `${NBSP}${m.unidade}` : ''}`
  return (
    <TabelaMetricas
      caption={paginaCase.metricas.caption(c.numero)}
      colunas={paginaCase.metricas.colunas}
      rotuloRegiao={paginaCase.metricas.regiao}
      larguras={['22%', '12%', '12%', '14%', '13%', '13%', '14%']}
      dentro="Tabela de métricas do case"
      linhas={c.metricas.map(m => ({
        chave: m.id,
        cabecalho: (
          <span className={styles.metrica}>
            <span className="t-body">{m.rotulo}</span>
            <span className="t-small c-2">{m.definicao}</span>
          </span>
        ),
        celulas: [
          <span key="a" className="t-body">{valor(m.antes, m)}</span>,
          <span key="d" className="t-body">{valor(m.depois, m)}</span>,
          <span key="v" className="t-body">{variacao(m)}</span>,
          <span key="p" className="t-small"><Dado valor={m.periodo} /></span>,
          <span key="f" className="t-small"><Dado valor={m.fonte} /></span>,
          <span key="m" className="t-small c-2"><Dado valor={m.metodo} /></span>,
        ],
      }))}
    />
  )
}

function formatar(v: number) {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(v)
}

/** Variação sempre com a base absoluta: "−32,1% (de 3,1 para 2,1 s)". Sem "+": a direção está no "de… para…". */
function variacao(m: MetricaCase): ReactNode {
  const a = known(m.antes)
  const d = known(m.depois)
  if (a === undefined || d === undefined) return <span className="c-3">—</span>
  const u = m.unidade ? `${NBSP}${m.unidade}` : ''
  const base = `(${paginaCase.metricas.de} ${formatar(a)} ${paginaCase.metricas.para} ${formatar(d)}${u})`
  if (a === 0) return base
  const pct = ((d - a) / Math.abs(a)) * 100
  const n = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(Math.abs(pct))
  return `${pct < 0 ? '−' : ''}${n}% ${base}`
}
