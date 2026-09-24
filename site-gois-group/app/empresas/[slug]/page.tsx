import type { CSSProperties } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { TransitionLink } from '@/components/layout/TransitionLink'
import { casoDaEmpresa, hostDe, numerosConfirmados } from '@/components/ecossistema/MapaEmpresas'
import { Dado, DadoPendente } from '@/components/sistema/DadoPendente'
import { Icone, Seta } from '@/components/sistema/Icone'
import { JsonLd } from '@/components/sistema/JsonLd'
import { Numero } from '@/components/sistema/Numero'
import { StatusMarcador } from '@/components/sistema/StatusMarcador'
import { Txt } from '@/components/sistema/Txt'
import { empresas } from '@/content/empresas'
import { paginaEmpresa as t, paginaEmpresas, RELACAO } from '@/content/copy/empresas'
import { ESCOPO_ROTULO, STATUS_ROTULO, visivel, type Empresa } from '@/lib/conteudo'
import { SHOW_PENDING } from '@/lib/env'
import { isPending, known } from '@/lib/pending'
import { breadcrumbLd, pageMetadata } from '@/lib/seo'
import s from './pagina.module.css'

/**
 * /empresas/[slug]/ (spec §14.2). Gerada só para empresas publicadas; em homologação
 * (NEXT_PUBLIC_SHOW_PENDING=1), também para as empresas-placeholder, como página-modelo com noindex.
 */
export const dynamicParams = false

type Params = { params: Promise<{ slug: string }> }

function empresasVisiveis(): Empresa[] {
  return empresas.filter(visivel).sort((a, b) => a.ordem - b.ordem)
}

export function generateStaticParams() {
  const lista = empresasVisiveis()
  // O export estático exige ao menos um parâmetro. Sem empresas visíveis, '_' gera só um 404
  // (a página chama notFound()): não entra no sitemap, que lista apenas empresas publicadas, e
  // nenhum link aponta para ela.
  return lista.length ? lista.map(e => ({ slug: e.slug })) : [{ slug: '_' }]
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const e = empresasVisiveis().find(x => x.slug === slug)
  if (!e) return { robots: { index: false, follow: false } }
  const path = `/empresas/${e.slug}/`
  const nome = known(e.nome)
  if (e.placeholder || !nome) {
    return pageMetadata({ title: t.metaModelo.titulo(e.codigo), description: t.metaModelo.descricao, path, noindex: true })
  }
  return pageMetadata({
    title: `${nome} — ${t.meta.sufixo}`,
    description: known(e.descricao) ?? paginaEmpresas.meta.description,
    path,
  })
}

export default async function Pagina({ params }: Params) {
  const { slug } = await params
  const lista = empresasVisiveis()
  const i = lista.findIndex(e => e.slug === slug)
  if (i < 0) notFound()

  const e = lista[i]
  const modelo = e.placeholder
  const nome = known(e.nome)
  const status = known(e.status)
  const relacao = known(e.relacao)
  const site = known(e.website)
  const numeros = numerosConfirmados(e, 3)
  const numeroModelo = SHOW_PENDING && numeros.length === 0 ? e.numeros.map(n => n.valor).find(isPending) : undefined
  const caso = casoDaEmpresa(e)
  const anterior = lista[i - 1]
  const proxima = lista[i + 1]

  return (
    <>
      {!modelo && nome && (
        <JsonLd
          data={breadcrumbLd([
            { nome: t.trilha.raiz, path: '/empresas/' },
            { nome, path: `/empresas/${e.slug}/` },
          ])}
        />
      )}

      {modelo && (
        <div className={s.faixa} role="note" data-dentro="Aviso de página-modelo">
          <p className={`grid t-label ${s.faixaTexto}`}>
            <span className="full">{t.faixa}</span>
          </p>
        </div>
      )}

      <section className={`secao secao--sem-linha ${modelo ? s.topoModelo : s.topo}`} aria-labelledby="empresa-titulo">
        <div className="grid">
          <nav className={s.trilha} aria-label={t.trilha.rotulo} data-dentro="Trilha de navegação">
            <ol>
              <li>
                <TransitionLink href="/empresas/" className="link link--quieto">
                  {t.trilha.raiz}
                </TransitionLink>
              </li>
              <li aria-current="page">
                <span className={s.barra} aria-hidden="true">
                  /
                </span>
                <Dado valor={e.nome} />
              </li>
            </ol>
          </nav>

          <div className={s.cabeca}>
            <p className={`t-label ${s.linhaStatus}`} data-dentro="Código e status">
              <span>{e.codigo}</span>
              <span aria-hidden="true">·</span>
              <span className={s.status}>
                <StatusMarcador status={status ?? 'reservado'} />
                {status ? STATUS_ROTULO[status] : <Dado valor={e.status} />}
              </span>
            </p>
            <h1
              id="empresa-titulo"
              className={`t-display-l ${s.h1}`}
              style={{ '--vt-nome': `empresa-${e.slug}` } as CSSProperties}
              data-dentro="Nome da empresa"
            >
              <Dado valor={e.nome} />
            </h1>
            <p className={`t-eyebrow c-2 ${s.meta}`} data-dentro="Segmento e relação">
              <Dado valor={e.segmento} />
              <span aria-hidden="true"> · </span>
              {relacao ? <Txt t={RELACAO[relacao]} /> : <Dado valor={e.relacao} />}
            </p>
            <p className={`t-lead c-2 ${s.descricao}`} data-dentro="Descrição">
              <Dado valor={e.descricao} />
            </p>
          </div>
          <div className={s.vazioTopo} data-dentro-vazio="" aria-hidden="true" />

          <dl className={s.ficha} aria-label={t.ficha.rotulo} data-dentro="Ficha da empresa">
            <div>
              <dt>{t.ficha.segmento}</dt>
              <dd>
                <Dado valor={e.segmento} />
              </dd>
            </div>
            <div>
              <dt>{t.ficha.relacao}</dt>
              <dd>{relacao ? <Txt t={RELACAO[relacao]} /> : <Dado valor={e.relacao} />}</dd>
            </div>
            <div>
              <dt>{t.ficha.status}</dt>
              <dd className={s.status}>
                <StatusMarcador status={status ?? 'reservado'} />
                {status ? STATUS_ROTULO[status] : <Dado valor={e.status} />}
              </dd>
            </div>
            <div>
              <dt>{t.ficha.desde}</dt>
              <dd>
                <Dado valor={e.desde} />
              </dd>
            </div>
            <div>
              <dt>{t.ficha.site}</dt>
              <dd>
                {site ? (
                  <>
                    <a href={site} target="_blank" rel="noopener" className={`link ${s.visitar}`}>
                      {t.ficha.visitar}
                      <span className="sr-only"> {t.ficha.abreNovaAba}</span>
                      <Icone nome="externo" />
                    </a>
                    <span className={`t-small c-3 ${s.host}`}>{hostDe(site)}</span>
                  </>
                ) : (
                  <Dado valor={e.website} />
                )}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="secao" aria-labelledby="empresa-escopo">
        <div className="grid">
          <h2 id="empresa-escopo" className={`t-display-m ${s.h2}`} data-reveal="corte" data-dentro="Título da seção">
            {t.h2Escopo} <Dado valor={e.nome} />.
          </h2>
          {isPending(e.escopo) ? (
            <p className={s.escopoPendente}>
              <Dado valor={e.escopo} />
            </p>
          ) : (
            <ul className={s.escopo} data-dentro="O que construímos">
              {e.escopo.map((x, k) => (
                <li
                  key={x.item}
                  className={s.escopoItem}
                  data-reveal="fade"
                  style={{ '--reveal-delay': `${Math.min(80 + k * 40, 240)}ms` } as CSSProperties}
                >
                  <h3 className={`t-title ${s.escopoTitulo}`}>{ESCOPO_ROTULO[x.item]}</h3>
                  <p className={`t-body c-2 ${s.escopoTexto}`}>{x.texto}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {(numeros.length > 0 || numeroModelo) && (
        <section className="secao" aria-labelledby="empresa-numeros">
          <div className="grid">
            <h2 id="empresa-numeros" className={`t-display-m ${s.h2}`} data-reveal="corte" data-dentro="Título da seção">
              {t.h2Numeros}
            </h2>
            {numeros.length > 0 ? (
              <ul className={s.numeros}>
                {numeros.map(n => (
                  <li key={n.id} className={s.numero}>
                    <Numero medida={n} />
                  </li>
                ))}
              </ul>
            ) : (
              numeroModelo && (
                <p className={s.escopoPendente}>
                  <DadoPendente dado={numeroModelo} />
                </p>
              )
            )}
          </div>
        </section>
      )}

      {caso && (
        <section className="secao" aria-labelledby="empresa-case">
          <div className="grid">
            <h2 id="empresa-case" className={`t-display-m ${s.h2}`} data-reveal="corte" data-dentro="Título da seção">
              {t.h2Case}
            </h2>
            <div className={s.casoLinha} data-reveal="fade">
              <TransitionLink href={`/cases/${caso.slug}/`} className={s.caso} vtName={`case-${caso.slug}`} data-dentro="Linha de case">
                <span className={`t-label c-3 ${s.casoNumero}`}>Nº {caso.numero}</span>
                <span className={s.casoTitulo}>
                  <span className="t-title" data-vt-alvo="">
                    <Dado valor={caso.titulo} />
                  </span>
                  <span className="t-small c-2">
                    <Dado valor={e.nome} />
                  </span>
                </span>
                <span className={`t-small c-2 ${s.casoEstrutura}`}>
                  <Dado valor={caso.estrutura}>{v => v.map(x => ESCOPO_ROTULO[x]).join(', ')}</Dado>
                </span>
                <Seta className={s.casoSeta} />
              </TransitionLink>
            </div>
          </div>
        </section>
      )}

      {(anterior || proxima) && (
        <nav className={`secao ${s.navegacao}`} aria-label={t.navegacao.rotulo} data-dentro="Navegação entre empresas">
          <div className="grid">
            {anterior && (
              <TransitionLink href={`/empresas/${anterior.slug}/`} className={`${s.vizinha} ${s.anterior}`}>
                <span className={`t-small c-3 ${s.vizinhaRotulo}`}>
                  <Seta dir="esquerda" className={s.vizinhaSeta} />
                  {t.navegacao.anterior}
                </span>
                <span className={`t-title ${s.vizinhaNome}`}>
                  <Dado valor={anterior.nome} neutro={anterior.codigo} />
                </span>
              </TransitionLink>
            )}
            {proxima && (
              <TransitionLink href={`/empresas/${proxima.slug}/`} className={`${s.vizinha} ${s.proxima}`}>
                <span className={`t-small c-3 ${s.vizinhaRotulo}`}>
                  {t.navegacao.proxima}
                  <Seta className={s.vizinhaSeta} />
                </span>
                <span className={`t-title ${s.vizinhaNome}`}>
                  <Dado valor={proxima.nome} neutro={proxima.codigo} />
                </span>
              </TransitionLink>
            )}
          </div>
        </nav>
      )}
    </>
  )
}
