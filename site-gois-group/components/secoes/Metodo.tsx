import type { CSSProperties } from 'react'
import { metodo } from '@/content/metodo'
import { copyMetodo as c } from '@/content/copy/metodo-capacidade'
import { Rotulo } from '@/components/sistema/Rotulo'
import { Botao } from '@/components/sistema/Botao'
import { Txt } from '@/components/sistema/Txt'
import { Trilho, type FaseTrilho } from '@/components/metodo/Trilho'
import s from '@/components/metodo/Metodo.module.css'

/**
 * 03 · Como construímos — Método Prumo (spec §8-03, §10).
 * Título + etiqueta de versão (mono) na mesma linha de base, lead, o trilho de seis fases e o fecho.
 * O conteúdo de cada painel é renderizado aqui, no servidor; o Trilho (cliente) só controla os disclosures.
 */
export function Metodo() {
  const fases: FaseTrilho[] = metodo.fases.map(f => ({
    id: `metodo-${f.codigo.toLowerCase()}`,
    codigo: f.codigo,
    nome: f.nome,
    verbo: f.verbo,
    painel: (
      <dl className={s.painel}>
        <div className={s.acontece}>
          <dt className={s.termo}>{c.painel.acontece}</dt>
          <dd className={`t-lead ${s.aconteceTexto}`}>{f.acontece}</dd>
        </div>
        <div className={s.artefatos}>
          <dt className={s.termo}>{c.painel.artefatos}</dt>
          <dd>
            <ul className={`t-body ${s.lista}`}>
              {f.artefatos.map(a => (
                <li key={a}>
                  <span className={s.travessao} aria-hidden="true">
                    —
                  </span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </dd>
        </div>
        <div className={s.passa}>
          <dt className={s.termo}>{c.painel.passaQuando}</dt>
          <dd className={`t-body ${s.passaTexto}`}>
            <Txt t={f.passaQuando} />
          </dd>
        </div>
      </dl>
    ),
  }))

  return (
    <section id="metodo" className="secao" aria-labelledby="metodo-titulo">
      <div className="grid">
        <Rotulo>{c.rotulo}</Rotulo>

        <div className={s.cabeca}>
          <h2 id="metodo-titulo" className={`t-display-l ${s.titulo}`} data-reveal="corte" data-dentro="Título da seção">
            {c.titulo}
          </h2>
          <p
            className={`t-label ${s.versao}`}
            data-reveal="fade"
            style={{ '--reveal-delay': '160ms' } as CSSProperties}
            data-dentro="Versão do método"
          >
            {c.etiqueta(metodo.versao)}
          </p>
          <div className={s.vazio} data-dentro-vazio aria-hidden="true" />
        </div>

        <p className={`t-lead c-2 ${s.lead}`} data-reveal="fade" data-dentro="Texto de apoio">
          {c.lead}
        </p>

        <div className={s.trilho}>
          <Trilho
            fases={fases}
            rotuloLaco={c.rotuloLaco}
            notaLaco={c.notaLaco}
            dentro={{ lista: 'Seis fases, cada uma com o seu critério de passagem', laco: 'Laço de retorno' }}
          />
        </div>

        <div className={s.fecho} data-reveal="fade">
          <p className={`t-body ${s.fechoTexto}`} data-dentro="Fecho">
            {c.fecho}
          </p>
          <Botao variante="secundario" href={c.cta.href} seta data-dentro="Botão secundário">
            {c.cta.rotulo}
          </Botao>
        </div>
      </div>
    </section>
  )
}
