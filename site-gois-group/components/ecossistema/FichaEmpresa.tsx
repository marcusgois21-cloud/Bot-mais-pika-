import { TransitionLink } from '@/components/layout/TransitionLink'
import { Dado, DadoPendente } from '@/components/sistema/DadoPendente'
import { Icone, Seta } from '@/components/sistema/Icone'
import { StatusMarcador } from '@/components/sistema/StatusMarcador'
import { Txt } from '@/components/sistema/Txt'
import { mapa, RELACAO } from '@/content/copy/empresas'
import { STATUS_ROTULO, type Case, type Empresa, type Medida } from '@/lib/conteudo'
import { SHOW_PENDING } from '@/lib/env'
import { contagem, NBSP, numero } from '@/lib/formatar'
import { isPending, known, type Maybe } from '@/lib/pending'
import s from './FichaEmpresa.module.css'

/* ── utilitários compartilhados pelo ecossistema ──────────────────────────── */

/** Valor real; em homologação, a instrução entre colchetes; em produção, nada. */
export function valorOuDica(v: Maybe<string> | undefined): string | undefined {
  if (v === undefined) return undefined
  if (!isPending(v)) return v
  return SHOW_PENDING ? v.hint : undefined
}

/** "loja.com.br" a partir da URL do site. */
export function hostDe(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, '')
  } catch {
    return url
  }
}

/** Só números confirmados: valor com fonte e período. Números pendentes não aparecem (spec §14.2). */
export function numerosConfirmados(e: Empresa, max: number): Medida[] {
  return e.numeros.filter(n => !isPending(n.valor) && !isPending(n.fonte) && !isPending(n.periodo)).slice(0, max)
}

function valorFormatado(m: Medida): string {
  const v = m.valor as number
  return Number.isInteger(v) ? contagem(v) : numero(v, 1)
}

/* ── ficha ─────────────────────────────────────────────────────────────────── */

/**
 * Ficha abaixo do mapa (spec §9.3): 4 blocos de 3 colunas — identidade · segmento e descrição ·
 * status, relação e site · até 2 números com fonte e "Ver case". O contêiner é aria-hidden (duplica o
 * nome acessível do link do nó); por isso os links daqui não entram na ordem do Tab.
 */
export function FichaEmpresa({ empresa: e, caso }: { empresa: Empresa; caso?: Case }) {
  const status = known(e.status)
  const relacao = known(e.relacao)
  const site = known(e.website)
  const numeros = numerosConfirmados(e, 2)
  const numeroModelo = SHOW_PENDING && numeros.length === 0 ? e.numeros.find(n => isPending(n.valor))?.valor : undefined

  return (
    <div className={s.ficha} data-ficha={e.slug}>
      <div className={`${s.bloco} ${s.identidade}`}>
        {e.logoSvg && <span className={s.logo} dangerouslySetInnerHTML={{ __html: e.logoSvg }} />}
        <p className={`t-display-m ${s.nome}`}>
          <Dado valor={e.nome} />
        </p>
      </div>

      <div className={s.bloco}>
        <p className="t-small c-3">
          <Dado valor={e.segmento} />
        </p>
        <p className={`t-small c-2 ${s.descricao}`}>
          <Dado valor={e.descricao} />
        </p>
      </div>

      <div className={s.bloco}>
        <p className={`t-label ${s.status}`}>
          <StatusMarcador status={status ?? 'reservado'} />
          {status ? STATUS_ROTULO[status] : <Dado valor={e.status} />}
        </p>
        <p className="t-small c-2">{relacao ? <Txt t={RELACAO[relacao]} /> : <Dado valor={e.relacao} />}</p>
        {site ? (
          <a href={site} target="_blank" rel="noopener" tabIndex={-1} className={`link link--quieto t-small ${s.site}`}>
            {hostDe(site)}
            <Icone nome="externo" />
          </a>
        ) : (
          <p className="t-small c-3">
            <Dado valor={e.website} />
          </p>
        )}
      </div>

      <div className={s.bloco}>
        {numeros.map(n => (
          <div key={n.id} className={s.numero}>
            <p className={s.valor}>
              {valorFormatado(n)}
              {n.unidade && (
                <span className={`t-label ${s.unidade}`}>
                  {NBSP}
                  {n.unidade}
                </span>
              )}
            </p>
            <p className="t-small c-2">{n.rotulo}</p>
            <p className="t-label c-3">
              Fonte: {known(n.fonte)} · Período: {known(n.periodo)}
            </p>
          </div>
        ))}
        {numeroModelo && isPending(numeroModelo) && (
          <p>
            <DadoPendente dado={numeroModelo} />
          </p>
        )}
        {caso && (
          <TransitionLink href={`/cases/${caso.slug}/`} tabIndex={-1} className={`link t-small ${s.caso}`}>
            {mapa.ficha.verCase}
            <Seta />
          </TransitionLink>
        )}
      </div>
    </div>
  )
}

/** Ficha sem empresa: o padrão (estado de hoje) ou a instrução de uso (com empresas). */
export function FichaTexto({ texto, discreto }: { texto: string; discreto?: boolean }) {
  return (
    <div className={s.ficha} data-ficha="" data-ativa="">
      <p className={`${discreto ? 't-small c-3' : 't-body c-2'} ${s.texto}`} data-dentro={discreto ? undefined : 'O padrão de cada ficha'}>
        {texto}
      </p>
    </div>
  )
}
