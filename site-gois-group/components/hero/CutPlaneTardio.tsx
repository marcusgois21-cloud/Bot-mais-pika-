'use client'

import { Component, type ReactNode } from 'react'
import dynamic from 'next/dynamic'

/**
 * Carrega o CutPlane só no cliente, depois da hidratação (spec §6.2 e §6.7). O `ssr: false` do
 * next/dynamic não é permitido em Server Components, por isso o Hero (servidor) usa este invólucro.
 * Nada é renderizado antes: sem JS, o hero mostra a grade em CSS.
 */
const CutPlane = dynamic(() => import('./CutPlane').then(m => m.CutPlane), { ssr: false })

/**
 * O Levantamento é um acréscimo: se o pedaço de JS não carregar (rede, bloqueador) ou falhar, a Home
 * continua inteira — o hero fica com a grade em CSS e o corte em repouso (rede de segurança do CSS).
 */
class SemLevantamento extends Component<{ children: ReactNode }, { falhou: boolean }> {
  state = { falhou: false }
  static getDerivedStateFromError() {
    return { falhou: true }
  }
  render() {
    return this.state.falhou ? null : this.props.children
  }
}

export function CutPlaneTardio() {
  return (
    <SemLevantamento>
      <CutPlane />
    </SemLevantamento>
  )
}
