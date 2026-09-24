import type { CSSProperties } from 'react'
import type { Metadata } from 'next'
import { MapaEmpresas } from '@/components/ecossistema/MapaEmpresas'
import { Botao } from '@/components/sistema/Botao'
import { JsonLd } from '@/components/sistema/JsonLd'
import { Rotulo } from '@/components/sistema/Rotulo'
import { empresas } from '@/content/empresas'
import { paginaEmpresas as t } from '@/content/copy/empresas'
import { publicada } from '@/lib/conteudo'
import { breadcrumbLd, pageMetadata } from '@/lib/seo'
import s from './pagina.module.css'

export const metadata: Metadata = pageMetadata({ title: t.meta.title, description: t.meta.description, path: '/empresas/' })

/**
 * /empresas/ (spec §14.1): o ecossistema completo. O mesmo mapa da Home, sem o limite de 12; alternador
 * Mapa · Lista com ≥ 1 empresa, filtros com ≥ 6. Enquanto houver menos de 3 publicadas, o bloco
 * "O que cada empresa publicada aqui terá" mostra o padrão — não uma promessa.
 */
export default function Pagina() {
  const publicadas = empresas.filter(publicada).length

  return (
    <>
      <JsonLd data={breadcrumbLd([{ nome: t.rotulo, path: '/empresas/' }])} />

      <section className={`secao secao--sem-linha ${s.topo}`} aria-labelledby="empresas-titulo">
        <div className="grid">
          <Rotulo>{t.rotulo}</Rotulo>
          <div className={s.cabeca}>
            <h1 id="empresas-titulo" className="t-display-l" data-dentro="Título da página">
              {t.h1}
            </h1>
            <p className={`t-lead c-2 ${s.lead}`} data-dentro="Texto de apoio">
              {t.lead}
            </p>
            {publicadas === 0 && (
              <p className={`t-title c-2 ${s.estado}`} data-dentro="Estado atual, declarado">
                {t.vazio}
              </p>
            )}
          </div>
          <div className={s.vazio} data-dentro-vazio="" aria-hidden="true" />

          <div className={s.mapa}>
            <MapaEmpresas empresas={empresas} controles />
          </div>
        </div>
      </section>

      {publicadas < 3 && (
        <section className="secao" aria-labelledby="empresas-padrao">
          <div className="grid">
            <h2 id="empresas-padrao" className={`t-display-m ${s.padraoTitulo}`} data-reveal="corte" data-dentro="Título do bloco">
              {t.bloco.titulo}
            </h2>
            <ol className={s.padrao} data-dentro="O que cada empresa terá">
              {t.bloco.itens.map((item, i) => (
                <li
                  key={item}
                  className={s.padraoItem}
                  data-reveal="fade"
                  style={{ '--reveal-delay': `${Math.min(80 + i * 40, 320)}ms` } as CSSProperties}
                >
                  <span className={`t-label c-3 ${s.indice}`} aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className={s.padraoTexto}>{item}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      <section className="secao" aria-labelledby="empresas-fecho">
        <div className="grid">
          <h2 id="empresas-fecho" className={`t-display-m ${s.fecho}`} data-reveal="corte" data-dentro="Fecho">
            {t.fecho.texto.split(/(?<=\?)\s/).map(frase => (
              <span key={frase} className={s.fechoFrase}>
                {frase}{' '}
              </span>
            ))}
          </h2>
          <div className={s.fechoCta} data-reveal="fade">
            <Botao href={t.fecho.href} seta data-dentro="Botão principal">
              {t.fecho.cta}
            </Botao>
          </div>
          <div className={s.fechoVazio} data-dentro-vazio="" aria-hidden="true" />
        </div>
      </section>
    </>
  )
}
