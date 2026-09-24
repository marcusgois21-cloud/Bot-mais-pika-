import type { Metadata } from 'next'
import { Formulario } from '@/components/contato/Formulario'
import { CopiarEmail } from '@/components/sistema/CopiarEmail'
import { DadoPendente } from '@/components/sistema/DadoPendente'
import { JsonLd } from '@/components/sistema/JsonLd'
import { Txt } from '@/components/sistema/Txt'
import { contatoPagina as t } from '@/content/copy/contato'
import { site } from '@/content/site'
import { CONTACT_EMAIL, CONTACT_ENDPOINT, IS_PRODUCTION, SHOW_PENDING } from '@/lib/env'
import { isPending, known } from '@/lib/pending'
import { breadcrumbLd, pageMetadata } from '@/lib/seo'
import s from './contato.module.css'

export const metadata: Metadata = pageMetadata({ title: t.meta.title, description: t.meta.description, path: '/contato/' })

/**
 * /contato/ (spec §14.7): H1 e lead nas colunas 1–8; formulário nas 1–7; lateral nas 9–12, sem sticky.
 * No mobile: título, lead, formulário e depois a lateral. O CTA do header some nesta página (Header).
 * Sem nenhum canal de envio, a homologação mostra a faixa "Canal de envio pendente"; em produção o
 * build falha antes (scripts/check-content.mjs).
 */
export default function Pagina() {
  const email = known(site.email)
  const prazo = site.prazoResposta
  const semCanal = !CONTACT_ENDPOINT && !CONTACT_EMAIL
  const faixa = semCanal && !IS_PRODUCTION
  const mostrarPrazo = !isPending(prazo) || SHOW_PENDING
  const mostrarCanais = Boolean(email) || SHOW_PENDING

  return (
    <>
      <JsonLd data={breadcrumbLd([{ nome: t.trilha, path: '/contato/' }])} />

      {faixa && (
        <div className={s.faixa} role="note" data-dentro="Aviso de homologação: canal de envio">
          <p className={`grid t-label ${s.faixaTexto}`}>
            <span className="full">
              {t.semCanal.split('e-mail').map((parte, i) => (
                <span key={i}>
                  {i > 0 && <span className="no-wrap">e-mail</span>}
                  {parte}
                </span>
              ))}
            </span>
          </p>
        </div>
      )}

      <section className={`secao secao--sem-linha ${s.pagina} ${faixa ? s.comFaixa : ''}`} aria-labelledby="contato-titulo">
        <div className="grid">
          <div className={s.cabeca}>
            <h1 id="contato-titulo" className="t-display-l" data-dentro="Título da página">
              {t.h1}
            </h1>
            <p className={`t-lead c-2 ${s.lead}`} data-dentro="Texto de apoio">
              {t.lead}
            </p>
          </div>
          <div className={s.vazioTopo} data-dentro-vazio="" aria-hidden="true" />

          <div className={s.formulario}>
            <Formulario />
          </div>
          <div className={s.vazioMeio} data-dentro-vazio="" aria-hidden="true" />

          <aside className={s.lateral}>
            <section className={s.bloco} aria-labelledby="contato-depois">
              <h2 id="contato-depois" className={`t-eyebrow ${s.blocoTitulo}`}>
                {t.depois.titulo}
              </h2>
              <ol className={s.passos} data-dentro="Próximos passos, em ordem">
                {t.depois.passos.map((passo, i) => (
                  <li key={i} className={s.passo}>
                    <span className={`t-label ${s.indice}`} aria-hidden="true">
                      {i + 1}
                    </span>
                    <span>
                      <Txt t={passo} />
                    </span>
                  </li>
                ))}
              </ol>
              {mostrarPrazo && (
                <p className={`t-small c-2 ${s.prazo}`} data-dentro="Prazo de resposta">
                  {t.depois.prazo}:{' '}
                  {isPending(prazo) ? <DadoPendente dado={prazo} /> : <span className="c-1">{prazo}</span>}
                </p>
              )}
            </section>

            {mostrarCanais && (
              <section className={s.bloco} aria-labelledby="contato-canais">
                <h2 id="contato-canais" className={`t-eyebrow ${s.blocoTitulo}`}>
                  {t.canais.titulo}
                </h2>
                <div className={s.canal} data-dentro="E-mail, com botão de copiar">
                  {email ? <CopiarEmail email={email} /> : isPending(site.email) && <DadoPendente dado={site.email} />}
                </div>
              </section>
            )}
          </aside>
        </div>
      </section>
    </>
  )
}
