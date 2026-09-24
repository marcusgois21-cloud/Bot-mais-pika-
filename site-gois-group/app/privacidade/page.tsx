import { Fragment } from 'react'
import type { Metadata } from 'next'
import { Txt } from '@/components/sistema/Txt'
import { JsonLd } from '@/components/sistema/JsonLd'
import { Dado, DadoPendente } from '@/components/sistema/DadoPendente'
import { privacidade as c, type Bloco } from '@/content/copy/privacidade'
import { site } from '@/content/site'
import { SHOW_PENDING } from '@/lib/env'
import { isPending } from '@/lib/pending'
import { breadcrumbLd, pageMetadata } from '@/lib/seo'
import s from './privacidade.module.css'

/** Indexada só quando o texto jurídico estiver publicado (spec §18.1). */
export const metadata: Metadata = pageMetadata({
  title: c.meta.title,
  description: c.meta.description,
  path: '/privacidade/',
  noindex: !site.privacidade.publicada,
})

function BlocoItem({ b }: { b: Bloco }) {
  switch (b.tipo) {
    case 'texto':
      return (
        <p className="t-body c-2">
          <Txt t={b.t} />
        </p>
      )
    case 'lista':
      return (
        <ul className={s.lista}>
          {b.itens.map(item => (
            <li key={item} className="t-body c-2">
              {item}
            </li>
          ))}
        </ul>
      )
    case 'campos':
      return (
        <dl className={s.campos}>
          {b.campos.map(campo => (
            <div key={campo.rotulo} className={s.campo}>
              <dt className="t-small c-3">{campo.rotulo}</dt>
              <dd className="t-body">
                <Dado valor={campo.valor} neutro={c.neutro} className="c-3" />
              </dd>
            </div>
          ))}
        </dl>
      )
    case 'codigo':
      return (
        <p className={`t-micro c-3 ${s.codigo}`}>
          {b.partes.map((parte, i) => (
            <Fragment key={parte}>
              {i > 0 && ' · '}
              <code>{parte}</code>
            </Fragment>
          ))}
        </p>
      )
  }
}

/**
 * /privacidade/ (spec §14.8): exigida pela LGPD porque o formulário coleta dados pessoais. Nove itens na
 * ordem da spec; o que só a Gois Group pode informar aparece como dado pendente (instrução em homologação,
 * "Pendente" em produção) e o texto jurídico pendente bloqueia o build de produção (spec §21.3).
 * Página estática, sem revelações: um documento de consulta fica parado.
 */
export default function Privacidade() {
  const juridico = c.textoJuridico
  return (
    <>
      <JsonLd data={breadcrumbLd([{ nome: c.meta.title, path: '/privacidade/' }])} />

      <section className={`secao secao--sem-linha ${s.topo}`} aria-labelledby="privacidade-titulo">
        <div className={`grid ${s.gradeTopo}`}>
          <h1 id="privacidade-titulo" className={`t-display-l ${s.titulo}`} data-dentro="Título da página">
            {c.h1}
          </h1>
          <div className={s.vazioTopo} data-dentro-vazio aria-hidden="true" />
          <div className={s.lead}>
            <p className="t-lead c-2" data-dentro="Texto de apoio">
              {c.lead}
            </p>
            {isPending(juridico) ? (
              SHOW_PENDING && (
                <p className={s.juridico}>
                  <DadoPendente dado={juridico} />
                </p>
              )
            ) : (
              <div className={s.juridico} data-dentro="Texto jurídico">
                {juridico.split(/\n{2,}/).map(par => (
                  <p key={par} className="t-body">
                    {par}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="secao">
        <div className={`grid ${s.gradeItens}`}>
          <ol className={s.itens} data-dentro="Nove itens, na ordem da lei">
            {c.itens.map((item, i) => (
              <li key={item.id} id={item.id} className={s.item}>
                <h2 className={`t-title ${s.itemTitulo}`}>
                  <span className={s.numero} aria-hidden="true">
                    {i + 1}
                  </span>
                  {item.titulo}
                </h2>
                <div className={s.itemCorpo}>
                  {item.blocos.map((b, k) => (
                    <BlocoItem key={k} b={b} />
                  ))}
                </div>
              </li>
            ))}
          </ol>
          <div className={s.vazio} data-dentro-vazio aria-hidden="true" />
        </div>
      </div>
    </>
  )
}
