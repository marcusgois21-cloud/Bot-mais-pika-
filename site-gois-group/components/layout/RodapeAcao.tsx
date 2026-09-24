'use client'

import { usePathname } from 'next/navigation'
import { TransitionLink } from './TransitionLink'
import { Seta } from '@/components/sistema/Icone'
import { CopiarEmail } from '@/components/sistema/CopiarEmail'
import styles from './Footer.module.css'

/**
 * Ação do rodapé (spec §15.2): "Iniciar um projeto" como link de texto, não como botão sólido. Cada
 * página já fecha com o seu botão primário; o rodapé não repete o gesto no mesmo viewport. Em /contato/
 * o link some (seria a própria página) e fica só o e-mail, quando configurado. O layout raiz não
 * re-renderiza na navegação cliente, por isso a rota vem de usePathname.
 */
export function RodapeAcao({ email }: { email?: string }) {
  const pathname = usePathname()
  const noContato = pathname.startsWith('/contato')
  if (noContato && !email) return null
  return (
    <div className={styles.cta}>
      {!noContato && (
        <TransitionLink href="/contato/?origem=footer" className={`link t-lead ${styles.ctaLink}`} data-dentro="Link para iniciar um projeto">
          Iniciar um projeto
          <Seta />
        </TransitionLink>
      )}
      {email && <CopiarEmail email={email} />}
    </div>
  )
}
