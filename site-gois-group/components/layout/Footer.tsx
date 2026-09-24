import { TransitionLink } from './TransitionLink'
import { Lockup } from '@/components/marca/Lockup'
import { RodapeAcao } from './RodapeAcao'
import { Seta } from '@/components/sistema/Icone'
import { VerPorDentroBotao } from '@/components/dentro/VerPorDentroBotao'
import { site, NAV_COMPLETA } from '@/content/site'
import { empresas } from '@/content/empresas'
import { publicada } from '@/lib/conteudo'
import { known } from '@/lib/pending'
import { BUILD_DATE, BUILD_SHA } from '@/lib/env'
import { ano, dataCurta } from '@/lib/formatar'
import styles from './Footer.module.css'

/**
 * Rodapé (spec §15.2): o fechamento da experiência. Uma célula só existe se houver dado real.
 */
export function Footer() {
  const email = known(site.email)
  const redes = known(site.redes)
  const razao = known(site.razaoSocial)
  const cnpj = known(site.cnpj)
  const publicadas = empresas.filter(publicada)

  return (
    <footer className={`site-footer ${styles.footer}`}>
      <div className="grid">
        <p className={`t-display-xl ${styles.frase}`} data-dentro="Frase de fechamento">
          <span className={styles.linha} data-reveal="corte">
            {site.fechamento[0]}
          </span>
          <span className={styles.linha} data-reveal="corte" style={{ '--reveal-delay': '120ms' } as React.CSSProperties}>
            {site.fechamento[1]}
          </span>
        </p>

        <RodapeAcao email={email} />

        <div className={styles.info}>
          <div className={styles.celula}>
            <TransitionLink href="/" aria-label="Gois Group — página inicial" className={styles.marca}>
              <Lockup altura={12} />
            </TransitionLink>
            <p className="t-small c-2">{site.tagline}</p>
          </div>

          <nav id="navegacao-rodape" className={styles.celula} aria-label="Rodapé">
            <p className={`t-small c-3 ${styles.titulo}`}>Navegação</p>
            <ul className={styles.lista}>
              {NAV_COMPLETA.map(item => (
                <li key={item.href}>
                  <TransitionLink href={item.href} className="link link--quieto t-small">
                    {item.rotulo}
                  </TransitionLink>
                </li>
              ))}
            </ul>
          </nav>

          {publicadas.length > 0 && (
            <div className={styles.celula}>
              <p className={`t-small c-3 ${styles.titulo}`}>Empresas</p>
              <ul className={styles.lista}>
                {publicadas.map(e => (
                  <li key={e.slug}>
                    <TransitionLink href={`/empresas/${e.slug}/`} className="link link--quieto t-small">
                      {known(e.nome)}
                    </TransitionLink>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {redes && redes.length > 0 && (
            <div className={styles.celula}>
              <p className={`t-small c-3 ${styles.titulo}`}>Redes</p>
              <ul className={styles.lista}>
                {redes.map(r => (
                  <li key={r.url}>
                    <a href={r.url} className="link link--quieto t-small" rel="noopener me" target="_blank">
                      {r.rede}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className={styles.celula}>
            <p className={`t-small c-3 ${styles.titulo}`}>Legal</p>
            <ul className={styles.lista}>
              <li>
                <TransitionLink href="/privacidade/" className="link link--quieto t-small">
                  Política de privacidade
                </TransitionLink>
              </li>
              {razao && <li className="t-small c-2">{razao}</li>}
              {cnpj && <li className="t-small c-2">CNPJ {cnpj}</li>}
            </ul>
          </div>
        </div>

        <div className={styles.barra}>
          <p className="t-small c-3">© {ano(BUILD_DATE)} Gois Group</p>
          <p className="t-small c-3">
            Versão publicada em {dataCurta(BUILD_DATE)} <span className="t-label" style={{ textTransform: 'none' }}>{BUILD_SHA}</span>
          </p>
          <VerPorDentroBotao />
          <a href="#conteudo" className={`link link--quieto t-small ${styles.topo}`}>
            Voltar ao topo <Seta dir="cima" />
          </a>
        </div>
      </div>
    </footer>
  )
}
