import { TransitionLink } from '@/components/layout/TransitionLink'
import { MapaEmpresas } from '@/components/ecossistema/MapaEmpresas'
import { Rotulo } from '@/components/sistema/Rotulo'
import { Seta } from '@/components/sistema/Icone'
import { empresas } from '@/content/empresas'
import { ecossistemaHome as t } from '@/content/copy/empresas'
import { publicada } from '@/lib/conteudo'
import s from './Ecossistema.module.css'

/**
 * Home 04 · Ecossistema (spec §8-04, §9). Mapa com centro: a Gois Group no meio, cada empresa publicada
 * ligada a ela pelo que construímos. Hoje: centro + 3 espaços reservados + "Nenhuma empresa publicada."
 */
export function Ecossistema() {
  const publicadas = empresas.filter(publicada).length

  return (
    <section id="ecossistema" className="secao" aria-labelledby="ecossistema-titulo">
      <div className="grid">
        <Rotulo>{t.rotulo}</Rotulo>

        <div className={s.cabeca}>
          <h2 id="ecossistema-titulo" className="t-display-l" data-reveal="corte" data-dentro="Título da seção">
            {t.titulo}
          </h2>
          <p className={`t-lead c-2 ${s.lead}`} data-reveal="fade" data-dentro="Texto de apoio">
            {t.lead}
          </p>
          {publicadas === 0 && (
            <p className={`t-title c-2 ${s.estado}`} data-reveal="fade" style={{ '--reveal-delay': '160ms' } as React.CSSProperties} data-dentro="Estado atual, declarado">
              {t.vazio}
            </p>
          )}
        </div>
        <div className={s.vazio} data-dentro-vazio="" aria-hidden="true" />

        <div className={s.mapa} data-reveal="fade" style={{ '--reveal-delay': '120ms' } as React.CSSProperties}>
          <MapaEmpresas empresas={empresas} limite={12} />
        </div>

        {publicadas > 0 && (
          <p className={s.cta}>
            <TransitionLink href={t.cta.href} className={`link ${s.ctaLink}`} data-dentro="Link para o ecossistema completo">
              {t.cta.rotulo}
              <Seta />
            </TransitionLink>
          </p>
        )}
      </div>
    </section>
  )
}
