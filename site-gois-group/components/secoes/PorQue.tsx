import { Rotulo } from '@/components/sistema/Rotulo'
import { Txt } from '@/components/sistema/Txt'
import { Seta } from '@/components/sistema/Icone'
import { TransitionLink } from '@/components/layout/TransitionLink'
import { VerPorDentroBotao } from '@/components/dentro/VerPorDentroBotao'
import { MedicaoAoVivo } from '@/components/medicao/MedicaoAoVivo'
import { LinhaCase } from '@/components/cases/LinhaCase'
import { empresaDoCase, medicao, porQue } from '@/content/copy/cases'
import { casos } from '@/content/cases'
import { empresas } from '@/content/empresas'
import { lcpSitesEntregues } from '@/content/numeros'
import { publicada } from '@/lib/conteudo'
import { known } from '@/lib/pending'
import { numero, NBSP } from '@/lib/formatar'
import styles from './PorQue.module.css'

/** Atraso de revelação em cascata: --stagger por item, no máximo --stagger-max. */
const cascata = (i: number) =>
  ({ '--reveal-delay': `min(calc(var(--stagger) * ${i}), var(--stagger-max))` }) as React.CSSProperties

/**
 * 07 · Por que a Gois Group (spec §8-07): trocar "confie" por "verifique".
 * A — seis compromissos [VALIDAR], cada um com a forma de conferir.
 * B — a prova: este site, medido agora no aparelho de quem visita (MedicaoAoVivo), o Case Nº 000
 *     e o botão "Ver esta página por dentro".
 */
export function PorQue() {
  const outros = casos.filter(c => publicada(c) && !c.metricasDoBuild).slice(0, 2)
  const lcp = lcpConfirmado()

  return (
    <section id="por-que" className="secao" aria-labelledby="por-que-titulo">
      <div className={`grid ${styles.grade}`}>
        <Rotulo>{porQue.rotulo}</Rotulo>
        <h2 id="por-que-titulo" className={`t-display-l ${styles.titulo}`} data-reveal="corte" data-dentro="Título da seção">
          {porQue.titulo}
        </h2>
        <div className={styles.vazio} data-dentro-vazio aria-hidden="true" />
        <p className={`t-lead c-2 ${styles.intro}`} data-reveal="fade" data-dentro="Texto de apoio">
          {porQue.intro}
        </p>

        {/* A · compromissos */}
        <ol className={styles.compromissos} data-dentro="Lista de compromissos que você pode conferir">
          {porQue.compromissos.map((c, i) => (
            <li key={c.id} className={styles.compromisso} data-reveal="fade" style={cascata(i)}>
              <h3 className={`t-title ${styles.termo}`}>
                <Txt t={c.termo} />
              </h3>
              <p className={`t-body c-2 ${styles.explicacao}`}>{c.explicacao}</p>
              <dl className={styles.verificar}>
                <dt className="t-small c-3">{porQue.rotuloComoVerificar}</dt>
                <dd className="t-small">{c.comoVerificar}</dd>
              </dl>
              {c.id === porQue.compromissoDoLcp && lcp && (
                <div className={styles.lcp} data-dentro="Número com fonte">
                  <p className="t-small c-2">{lcp.rotulo}</p>
                  <p className={styles.lcpValor}>
                    {lcp.valor}
                    {NBSP}
                    <span className={`t-label c-2 ${styles.unidade}`}>{lcp.unidade}</span>
                  </p>
                  <p className="t-label c-3">{lcp.fonte}</p>
                </div>
              )}
            </li>
          ))}
        </ol>

        {/* B · a prova */}
        <div className={styles.prova}>
          <h3 className={`t-display-m ${styles.provaTitulo}`} data-reveal="corte" data-dentro="Título do bloco">
            {porQue.prova.titulo}
          </h3>
          <p className={`t-lead c-2 ${styles.provaIntro}`} data-reveal="fade" data-dentro="Texto de apoio">
            {porQue.prova.intro}
          </p>
          <div className={styles.medicoes} data-reveal="fade">
            <MedicaoAoVivo copy={medicao} />
          </div>
          <p className={`t-small c-3 ${styles.legenda}`} data-reveal="fade" data-dentro="Legenda das medições">
            {porQue.prova.legenda}
          </p>
          <div className={styles.acoes} data-reveal="fade">
            <TransitionLink href="/cases/este-site/" className="link t-body" data-dentro="Link para o case deste site">
              {porQue.prova.linkCase}
              <Seta />
            </TransitionLink>
            <TransitionLink href="/cases/" className="link link--quieto t-body c-2" data-dentro="Link para todos os cases">
              {porQue.prova.linkTodos}
              <Seta />
            </TransitionLink>
            <span className={styles.dentro} data-dentro="Botão que mostra esta página por dentro">
              <VerPorDentroBotao variante="secundario" />
            </span>
          </div>

          {outros.length > 0 && (
            <div className={styles.outros}>
              <p className="t-small c-3">{porQue.prova.rotuloOutros}</p>
              <ol className={styles.registro}>
                {outros.map(c => (
                  <LinhaCase key={c.slug} caso={c} empresa={empresaDoCase(c, empresas)} nivel={4} />
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

/**
 * p75 de LCP dos sites entregues (spec §13.1, D23): só aparece, ao lado de "Orçamento de desempenho",
 * quando valor, fonte, período e data de verificação estão confirmados. Pendente: não aparece.
 */
function lcpConfirmado() {
  const m = lcpSitesEntregues
  const valor = known(m.valor)
  const fonte = known(m.fonte)
  const periodo = known(m.periodo)
  const verificado = known(m.verificadoEm)
  if (valor === undefined || !fonte || !periodo || !verificado) return null
  const [a, mes] = verificado.split('-')
  return {
    rotulo: m.rotulo,
    valor: numero(valor, 2),
    unidade: m.unidade ?? '',
    fonte: porQue.linhaFonteLcp(fonte, periodo, mes && a ? `${mes}.${a}` : verificado),
  }
}
