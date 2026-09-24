import type { CSSProperties } from 'react'
import { TransitionLink } from '@/components/layout/TransitionLink'
import { Simbolo } from '@/components/marca/Simbolo'
import { Dado } from '@/components/sistema/DadoPendente'
import { Icone, Seta } from '@/components/sistema/Icone'
import { StatusMarcador } from '@/components/sistema/StatusMarcador'
import { Txt } from '@/components/sistema/Txt'
import { casos } from '@/content/cases'
import { mapa, resumoPublicadas, RELACAO, escopoEmFrase, STATUS_ORDEM, RELACAO_ORDEM } from '@/content/copy/empresas'
import { publicada, visivel, STATUS_ROTULO, type Empresa } from '@/lib/conteudo'
import { isPending, known } from '@/lib/pending'
import { Conectores, ControlesVista } from './Conectores'
import { FichaEmpresa, FichaTexto, valorOuDica } from './FichaEmpresa'
export { valorOuDica, hostDe, numerosConfirmados } from './FichaEmpresa'
import s from './MapaEmpresas.module.css'

/* ── dados ─────────────────────────────────────────────────────────────────── */

type Lado = 'esq' | 'dir' | 'eixo'
type Faixa = 'topo' | 'meio' | 'base'
export type Slot = {
  col: number
  linha: number
  lado: Lado
  faixa: Faixa
  area: string
  /** Nós cuja coluna já tem outro nó entre eles e a linha do meio descem por um corredor (a canaleta
   *  à direita da coluna N) em vez de atravessar o rótulo do vizinho. */
  corredor?: number
}

/** Slots do mapa (spec §9.2). "6.5" = o eixo entre as colunas 6 e 7, centro do mapa. */
const SLOTS: ReadonlyArray<readonly [number, number]> = [
  [3, 1], [10, 1], [6.5, 3], [3, 3], [10, 3], [1, 2], [12, 2], [6.5, 1], [1, 1], [12, 1], [1, 3], [12, 3],
]
/** Além de 12 (só em /empresas/), o mapa ganha linhas abaixo, sempre nas colunas dos cantos. */
const EXTRAS = [3, 10, 1, 12] as const

export function slotDe(i: number): Slot {
  const [col, linha] = i < SLOTS.length ? SLOTS[i] : [EXTRAS[(i - SLOTS.length) % 4], 4 + Math.floor((i - SLOTS.length) / 4)]
  const lado: Lado = col === 6.5 ? 'eixo' : col <= 6 ? 'esq' : 'dir'
  const area = lado === 'eixo' ? '6 / 8' : lado === 'esq' ? `${col} / ${col + 2}` : `${col - 1} / ${col + 1}`
  const faixa: Faixa = linha === 1 ? 'topo' : linha === 2 ? 'meio' : 'base'
  const corredor =
    linha === 2 ? undefined : col === 1 ? 2 : col === 12 ? 10 : linha > 3 ? (col === 3 ? 4 : col === 10 ? 8 : undefined) : undefined
  return { col, linha, lado, faixa, area, corredor }
}

export type No = { tipo: 'empresa'; empresa: Empresa; slot: Slot } | { tipo: 'reservado'; chave: string; slot: Slot }

/**
 * O que o mapa mostra. Produção: só empresas publicadas; homologação: também as empresas-placeholder
 * (com as instruções entre colchetes). Espaços reservados completam a composição até 3 — nunca mais que
 * isso (spec §7.4) — e somem a partir de 3 empresas.
 */
export function montarEcossistema(todas: Empresa[], limite?: number) {
  const visiveis = todas.filter(visivel).sort((a, b) => a.ordem - b.ordem)
  const itens = limite ? visiveis.slice(0, limite) : visiveis
  const reservados = Math.max(0, 3 - itens.length)
  const nos: No[] = [
    ...itens.map((empresa, i): No => ({ tipo: 'empresa', empresa, slot: slotDe(i) })),
    ...Array.from({ length: reservados }, (_, k): No => ({ tipo: 'reservado', chave: `reservado-${k}`, slot: slotDe(itens.length + k) })),
  ]
  return { nos, itens, visiveis, publicadas: todas.filter(publicada).length }
}

/** Case relacionado, só se ele aparece publicamente (ou é página-modelo em homologação). */
export function casoDaEmpresa(e: Empresa) {
  if (!e.caseSlug) return undefined
  return casos.find(c => c.slug === e.caseSlug && visivel(c))
}

/** "E-01, {Nome}, {segmento}, {status}. O que construímos: {escopo}." (spec §9.3) */
function nomeAcessivel(e: Empresa): string {
  const status = isPending(e.status) ? valorOuDica(e.status) : STATUS_ROTULO[e.status]
  const partes = [e.codigo, valorOuDica(e.nome), valorOuDica(e.segmento), status].filter(Boolean)
  const escopo = isPending(e.escopo) ? valorOuDica(e.escopo) : escopoEmFrase(e.escopo.map(x => x.item))
  return `${partes.join(', ')}.${escopo ? ` ${mapa.oQueConstruimos}: ${escopo}.` : ''}`
}

/* ── componente ────────────────────────────────────────────────────────────── */

type Props = {
  empresas: Empresa[]
  /** Home: 12. /empresas/: sem limite. */
  limite?: number
  /** /empresas/: alternador Mapa · Lista (≥ 1) e filtros (≥ 6). */
  controles?: boolean
  className?: string
}

/**
 * Mapa com centro (spec §9). Um único <ol>: no desktop, posicionado no grid de 12 colunas × 3 linhas
 * com conectores medidos; abaixo de 900 px, restilizado por CSS como espinha vertical; na vista Lista,
 * como linhas de tabela. Espaços reservados são aria-hidden e ficam fora do foco.
 */
export function MapaEmpresas({ empresas, limite, controles = false, className }: Props) {
  const { nos, itens, publicadas } = montarEcossistema(empresas, limite)
  const interativo = itens.length > 0
  const alternador = controles && itens.length >= 1
  const filtros = controles && itens.length >= 6
  const vista = controles && itens.length > 12 ? 'lista' : 'mapa'
  const extras = Math.max(0, Math.max(...nos.map(n => n.slot.linha)) - 3)
  // traço pontilhado = pendente ou reservado (§7.1): vale para espaços reservados e empresas-modelo
  const primeiroReservado = nos[0]?.tipo === 'reservado' || (nos[0]?.tipo === 'empresa' && nos[0].empresa.placeholder)

  const campoStyle = extras ? ({ '--linhas-extra': Array(extras).fill('var(--r3)').join(' ') } as CSSProperties) : undefined

  return (
    <div className={`${s.raiz} ${className ?? ''}`} data-ecossistema="" data-vista={vista}>
      {(alternador || filtros) && (
        <ControlesVista
          alternador={alternador}
          filtros={filtros}
          vistaInicial={vista}
          total={itens.length}
          status={STATUS_ORDEM.filter(st => itens.some(e => known(e.status) === st)).map(st => ({ valor: st, rotulo: STATUS_ROTULO[st] }))}
          relacoes={RELACAO_ORDEM.filter(r => itens.some(e => known(e.relacao) === r)).map(r => ({ valor: r, rotulo: RELACAO[r] }))}
        />
      )}

      <p className="sr-only">{resumoPublicadas(publicadas)}</p>

      <div
        className={s.campo}
        style={campoStyle}
        data-denso={nos.length >= 11 ? '' : undefined}
        data-primeiro-reservado={primeiroReservado ? '' : undefined}
        data-dentro="Mapa do ecossistema, desenhado por código"
      >
        <div className={s.centro} data-centro="" aria-hidden="true">
          <Simbolo tamanho={32} className={s.simbolo32} />
          <Simbolo tamanho={24} className={s.simbolo24} />
          <span className={s.centroTexto}>
            <span className={`t-title ${s.centroNome}`}>{mapa.centro.nome}</span>
            <span className="t-small c-3">{mapa.centro.apoio}</span>
          </span>
        </div>

        <ol className={s.lista} aria-label={mapa.rotuloLista} aria-hidden={interativo ? undefined : true}>
          {nos.map((no, i) =>
            no.tipo === 'empresa' ? (
              <NoEmpresa key={no.empresa.slug} empresa={no.empresa} slot={no.slot} ultimo={i === nos.length - 1} />
            ) : (
              <NoReservado key={no.chave} slot={no.slot} ultimo={i === nos.length - 1} />
            ),
          )}
        </ol>

        <Conectores />
      </div>

      <ul className={s.legenda} aria-hidden="true" data-dentro="Legenda dos estados">
        {mapa.legenda.map(l => (
          <li key={l.estado}>
            <StatusMarcador status={l.estado} />
            {l.rotulo}
          </li>
        ))}
      </ul>

      <div className={s.fichas} data-fichas="" data-interativa={interativo ? '' : undefined} aria-hidden={interativo ? true : undefined}>
        <FichaTexto texto={interativo ? mapa.ficha.semSelecao : mapa.ficha.padrao} discreto={interativo} />
        {itens.map(e => (
          <FichaEmpresa key={e.slug} empresa={e} caso={casoDaEmpresa(e)} />
        ))}
      </div>
    </div>
  )
}

/** Posição no campo (≥ 900 px): área de colunas e linha do slot. */
function atributosSlot(slot: Slot) {
  return {
    'data-lado': slot.lado,
    'data-faixa': slot.faixa,
    'data-linha': slot.linha,
    'data-col': slot.col,
    'data-corredor': slot.corredor,
    style: { '--no-col': slot.area, '--no-linha': String(slot.linha) } as CSSProperties,
  }
}

function NoEmpresa({ empresa: e, slot, ultimo }: { empresa: Empresa; slot: Slot; ultimo: boolean }) {
  const status = known(e.status)
  const relacao = known(e.relacao)
  const site = known(e.website)
  const nome = valorOuDica(e.nome) ?? e.codigo
  const caso = casoDaEmpresa(e)
  return (
    <li
      className={s.no}
      data-no="empresa"
      data-slug={e.slug}
      data-modelo={e.placeholder ? '' : undefined}
      {...atributosSlot(slot)}
      data-status={status ?? ''}
      data-relacao={relacao ?? ''}
      data-ultimo={ultimo ? '' : undefined}
    >
      <TransitionLink
        href={`/empresas/${e.slug}/`}
        className={s.link}
        data-no-link={e.slug}
        aria-label={nomeAcessivel(e)}
        vtName={`empresa-${e.slug}`}
        data-dentro="Empresa do ecossistema"
      >
        <span className={s.marcador} data-marcador-no="">
          <StatusMarcador status={status ?? 'reservado'} />
        </span>
        <span className={`t-label ${s.codigo}`}>{e.codigo}</span>
        <span className={s.nome} data-vt-alvo="">
          <Dado valor={e.nome} />
        </span>
        {/* No mapa, só o nome carrega a instrução pendente; segmento e status pendentes aparecem
            na ficha, na vista Lista e na página-modelo. */}
        <span className={s.segmento} data-pendente-no={isPending(e.segmento) ? '' : undefined}>
          <Dado valor={e.segmento} />
        </span>
        <span className={`t-label ${s.status}`} data-pendente-no={isPending(e.status) ? '' : undefined}>
          <Dado valor={e.status}>{v => STATUS_ROTULO[v]}</Dado>
        </span>
        <Seta className={s.seta} />
      </TransitionLink>

      {/* Só na vista Lista: relação, site e case (spec §14.1). */}
      <span className={`t-small ${s.relacao}`}>{relacao ? <Txt t={RELACAO[relacao]} /> : <Dado valor={e.relacao} />}</span>
      <span className={`t-small ${s.site}`}>
        {site ? (
          <a href={site} target="_blank" rel="noopener" className="link link--quieto">
            {mapa.lista.site}
            <span className="sr-only">
              {' '}
              de {nome} {mapa.lista.abreNovaAba}
            </span>
            <Icone nome="externo" />
          </a>
        ) : (
          <Dado valor={e.website} />
        )}
      </span>
      <span className={`t-small ${s.caso}`}>
        {caso ? (
          <TransitionLink href={`/cases/${caso.slug}/`} className="link link--quieto">
            {mapa.lista.verCase}
            <span className="sr-only"> de {nome}</span>
          </TransitionLink>
        ) : (
          <span aria-hidden="true" className="c-3">
            —
          </span>
        )}
      </span>
    </li>
  )
}

function NoReservado({ slot, ultimo }: { slot: Slot; ultimo: boolean }) {
  return (
    <li
      className={`${s.no} ${s.reservado}`}
      data-no="reservado"
      {...atributosSlot(slot)}
      data-ultimo={ultimo ? '' : undefined}
      aria-hidden="true"
      data-dentro="Espaço reservado"
    >
      <span className={s.link}>
        <span className={s.marcador} data-marcador-no="">
          <StatusMarcador status="reservado" />
        </span>
        <span className={`t-small ${s.reservadoTexto}`}>{mapa.reservado}</span>
      </span>
    </li>
  )
}
