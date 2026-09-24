import { Botao } from '@/components/sistema/Botao'
import { Seta } from '@/components/sistema/Icone'
import { Simbolo } from '@/components/marca/Simbolo'
import { heroCopy as c } from '@/content/copy/hero'
import { CutPlaneTardio } from './CutPlaneTardio'
import styles from './Hero.module.css'

/**
 * Hero da Home (spec §6): "Plano de Corte".
 *
 * Três camadas num DOM só, responsivo só por CSS:
 * - z0 `estrutura` (aria-hidden, ATRÁS do texto): a página por dentro. Sem JS, a grade em CSS; com JS, o
 *   Levantamento medido do layout real (CutPlane, carregado depois da hidratação). O recorte à direita
 *   do corte é feito por dois transforms opostos (clip-x / inner-x): só compositor.
 * - z1 `conteudo`: eyebrow, H1, subtítulo, CTAs e legenda — sólidos e visíveis no primeiro paint (LCP).
 * - z2 `corte`: a linha de 1 px em Rubrica saindo da fenda do símbolo, o range acessível e as dicas.
 *
 * Repouso só com CSS (--x-rest, em unidades de contêiner). O JS grava `--x` em px no <section>.
 */
export function Hero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-titulo" data-hero>
      <div className={styles.estrutura} aria-hidden="true" data-decorativo>
        <div className={styles.clipX}>
          <div className={styles.clipScroll}>
            <div className={styles.innerScroll}>
              <div className={styles.innerX}>
                <div className={styles.gradeCss} />
                <CutPlaneTardio />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`grid ${styles.conteudo}`} data-hero-grade>
        <p className={`t-eyebrow ${styles.eyebrow}`} data-hero-alvo="eyebrow" data-dentro="Apresentação: quem somos e o que fazemos">
          {c.eyebrow}
        </p>
        <h1 id="hero-titulo" className={`t-hero ${styles.titulo}`} data-dentro="Título principal">
          {/* o espaço fica no mesmo nó de texto da palavra: separado (`{x} ` vira "x<!-- --> "), o Chromium o
              descarta no nome acessível e o título seria lido "Construímossites" */}
          <span className={styles.ln}>
            {`${c.titulo.construimos} `}
            <span className={styles.lnSm}>{c.titulo.sites}</span>
          </span>{' '}
          <span className={styles.ln}>{c.titulo.deDentro}</span> <span className={styles.ln}>{c.titulo.paraFora}</span>
        </h1>
        <p className={`t-lead ${styles.sub}`} data-hero-alvo="sub" data-dentro="Texto de apoio">
          {c.subtitulo}
        </p>
        <div className={styles.ctas}>
          <span className={styles.ctaPrimario} data-hero-alvo="cta">
            <Botao href={c.ctaPrimario.href} magnetico seta largo data-dentro="Botão principal">
              {c.ctaPrimario.rotulo}
            </Botao>
          </span>
          <a href={c.ctaSecundario.href} className={`link ${styles.ctaSecundario}`} data-hero-alvo="cta2" data-dentro="Link para o método">
            {c.ctaSecundario.rotulo}
            <Seta dir="baixo" />
          </a>
        </div>
        <p className={`t-small ${styles.legenda}`} data-dentro="Legenda do corte">
          <span className={styles.legendaTela}>{c.legenda.tela}</span>
          <span className={styles.legendaToque}>{c.legenda.toque}</span>
        </p>
        <div className={styles.vazio} data-dentro-vazio aria-hidden="true" />
      </div>

      <div className={styles.corte} data-decorativo>
        {/* Revelado pelo CutPlane quando funciona; sem JS não existe (hidden). max/value vêm da grade medida. */}
        <input
          className={styles.cutRange}
          type="range"
          min={0}
          max={12}
          step={1}
          aria-label={c.corte.rotulo}
          aria-describedby="hero-dica-teclado"
          hidden
          data-hero-range
        />
        <div className={styles.cutX}>
          <div className={styles.cutScroll}>
            <span className={styles.alca} aria-hidden="true" data-dentro="Alça do corte">
              <Simbolo tamanho={24} />
            </span>
            <span className={styles.linha} aria-hidden="true" />
            <p className={`t-small ${styles.dica} ${styles.dicaCursor}`} aria-hidden="true" data-hero-dica>
              {c.dica.cursor}
            </p>
            <p id="hero-dica-teclado" className={`t-small ${styles.dica} ${styles.dicaTeclado}`}>
              {c.dica.teclado}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
