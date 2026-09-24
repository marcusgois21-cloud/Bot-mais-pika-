import type { CSSProperties, ReactNode } from 'react'
import { disciplinas, type Disciplina } from '@/content/capacidades'
import { numerosHome } from '@/content/numeros'
import { copyCapacidade as c } from '@/content/copy/metodo-capacidade'
import derivados from '@/content/generated/derivados.json'
import { isValidar, validar, type Texto } from '@/lib/conteudo'
import { numero, NBSP } from '@/lib/formatar'
import { Rotulo } from '@/components/sistema/Rotulo'
import { Botao } from '@/components/sistema/Botao'
import { Txt } from '@/components/sistema/Txt'
import { Seta } from '@/components/sistema/Icone'
import { Numero } from '@/components/sistema/Numero'
import botaoStyles from '@/components/sistema/Botao.module.css'
import s from '@/components/capacidade/Capacidade.module.css'

/**
 * 05 · Capacidade (spec §8-05, §11, §13).
 * 05.1 "Um botão atravessa quatro disciplinas": o botão REAL do site (o mesmo componente do hero, funcional)
 * e quatro faixas — disciplina e pergunta · decisão e capacidades · representação. Passar o ponteiro numa
 * faixa contorna a parte do botão que ela decide (só CSS, :has()). Explosão ligada ao scroll só no
 * desktop, só CSS, dentro de @supports.
 * 05.2 Números: o componente Numero, quatro células da mesma altura.
 *
 * {contraste} e {altura} vêm de content/generated/derivados.json (scripts/derive-tokens.mjs, a partir de
 * styles/tokens.css). Nada é digitado à mão.
 */

type Parte = 'rotulo' | 'caixa' | 'estados' | 'origem'
const PARTE: Record<Disciplina['realce'], Parte> = {
  promessa: 'rotulo',
  botao: 'caixa',
  estados: 'estados',
  envio: 'origem',
}

const { contraste, altura } = derivados.botaoPrimario
const CONTRASTE = numero(contraste, 2)
const ALTURA = `${numero(altura)}${NBSP}px`
/** ponto médio entre itens: preso ao item anterior, quebra depois dele */
const SEPARADOR = `${NBSP}· `

function comMedidas(t: Texto): Texto {
  const trocar = (x: string) => x.replace('{contraste}', CONTRASTE).replace(/\{altura\}\s?px/, ALTURA)
  return isValidar(t) ? validar(trocar(t.texto), t.aprovado) : trocar(t)
}

/** lista em mono, separada por pontos médios (os pontos não são lidos) */
function ListaMono({ itens, rotulo }: { itens: string[]; rotulo: string }) {
  return (
    <ul className={`t-label ${s.mono}`} aria-label={rotulo}>
      {itens.map((item, i) => (
        <li key={item}>
          {i > 0 && (
            <span className={s.ponto} aria-hidden="true">
              {SEPARADOR}
            </span>
          )}
          {item}
        </li>
      ))}
    </ul>
  )
}

function Representacao({ realce }: { realce: Disciplina['realce'] }): ReactNode {
  switch (realce) {
    case 'promessa':
      // a frase-promessa repete a decisão ao lado: para leitor de tela, não é lida duas vezes
      return (
        <p className={`t-body ${s.promessa}`} aria-hidden="true">
          <Txt t={c.promessa} />
        </p>
      )
    case 'botao':
      // o botão desenhado com as medidas derivadas do build; a informação já está na decisão, ao lado
      return (
        <div className={s.desenho} aria-hidden="true" data-dentro="Botão desenhado, medidas do build">
          <span className={s.desenhoBotao}>
            <span className={`${botaoStyles.botao} ${botaoStyles.primario} ${s.replica}`}>
              <span>{c.botao.rotulo}</span>
              <Seta />
            </span>
            {/* cota da altura: mede exatamente --control-h, o mesmo token do botão */}
            <span className={s.cota} />
          </span>
          <span className={`t-micro ${s.medidas}`}>
            <span className={s.medida}>
              <span className={s.medidaRotulo}>{c.medidas.altura}</span> {ALTURA}
            </span>
            <span className={s.medida}>
              <span className={s.medidaRotulo}>{c.medidas.contraste}</span> {CONTRASTE}:1
            </span>
          </span>
        </div>
      )
    case 'estados':
      return <ListaMono itens={c.estados} rotulo={c.rotuloEstados} />
    case 'envio':
      return <ListaMono itens={c.campos} rotulo={c.rotuloCampos} />
  }
}

export function Capacidade() {
  return (
    <section id="capacidade" className={`secao ${s.secao}`} aria-labelledby="capacidade-rotulo">
      {/* 05.1 — Um botão atravessa quatro disciplinas */}
      <div className="grid">
        <Rotulo id="capacidade-rotulo">{c.rotulo}</Rotulo>
        <h2 id="capacidade-titulo" className={`t-display-l ${s.titulo}`} data-reveal="corte" data-dentro="Título da seção">
          {c.titulo}
        </h2>
        <div className={s.vazioCabeca} data-dentro-vazio aria-hidden="true" />
        <p className={`t-lead c-2 ${s.lead}`} data-reveal="fade" data-dentro="Texto de apoio">
          {c.lead}
        </p>

        {/* o botão real, com as quatro partes que as faixas decidem */}
        <div className={s.especime} data-reveal="fade">
          <div className={`${s.lado} ${s.ladoEstado}`} aria-hidden="true">
            <p className={`${s.anotacao} ${s.anotacaoEstado}`} data-parte="estados">
              <span className="t-micro c-3">{c.especime.estado}</span>
              <span className={`t-label ${s.estadoRepouso}`}>{c.especime.repouso}</span>
              <span className={`t-label ${s.estadoFoco}`}>{c.especime.foco}</span>
            </p>
            <span className={s.guia} />
          </div>
          <span className={s.caixa} data-parte="caixa">
            <Botao href={c.botao.href} seta data-dentro="Botão principal: o mesmo do topo da página">
              <span className={s.parteRotulo} data-parte="rotulo">
                {c.botao.rotulo}
              </span>
            </Botao>
          </span>
          <div className={`${s.lado} ${s.ladoOrigem}`} aria-hidden="true">
            <span className={s.guia} />
            <p className={`${s.anotacao} ${s.anotacaoOrigem}`} data-parte="origem">
              <span className="t-micro c-3">{c.especime.origem}</span>
              <span className="t-label">{c.botao.origem}</span>
            </p>
          </div>
        </div>

        <ol className={s.faixas} data-dentro="Quatro disciplinas, uma decisão cada">
          {disciplinas.map((d, i) => (
            <li key={d.nome} className={s.faixa} data-realce={PARTE[d.realce]} style={{ '--i': i } as CSSProperties}>
              <span
                className={s.hairline}
                data-reveal="linha"
                style={{ '--reveal-delay': `${i * 60}ms` } as CSSProperties}
                aria-hidden="true"
              />
              <div className={s.disciplina}>
                <h3 className={`t-display-m ${s.nome}`}>{d.nome}</h3>
                <p className={`t-body ${s.pergunta}`}>{d.pergunta}</p>
              </div>
              <div className={s.decisao}>
                <p className="t-body">
                  <Txt t={comMedidas(d.decisao)} />
                </p>
                <ul className={`t-small ${s.capacidades}`} aria-label={c.rotuloCapacidades}>
                  {d.capacidades.map((cap, j) => (
                    <li key={cap}>
                      {j > 0 && (
                        <span className={s.ponto} aria-hidden="true">
                          {SEPARADOR}
                        </span>
                      )}
                      {cap}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={s.representacao}>
                <Representacao realce={d.realce} />
              </div>
            </li>
          ))}
        </ol>

        <p className={`t-lead ${s.fecho}`} data-reveal="fade" data-dentro="Fecho">
          {c.fecho}
        </p>
      </div>

      {/* 05.2 — Números */}
      <div className={`grid ${s.numeros}`}>
        <h2 id="numeros-titulo" className={`t-display-m ${s.numerosTitulo}`} data-reveal="corte" data-dentro="Título do bloco">
          {c.numeros.titulo}
        </h2>
        <div className={s.vazioNumeros} data-dentro-vazio aria-hidden="true" />
        <p className={`t-lead c-2 ${s.numerosLead}`} data-reveal="fade" data-dentro="Texto de apoio">
          {c.numeros.lead}
        </p>
        <ul className={s.celulas} aria-labelledby="numeros-titulo">
          {numerosHome.map((m, i) => (
            <li key={m.id} className={s.celula}>
              <span
                className={s.hairline}
                data-reveal="linha"
                style={{ '--reveal-delay': `${i * 60}ms` } as CSSProperties}
                aria-hidden="true"
              />
              <Numero medida={m} className={s.numero} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
