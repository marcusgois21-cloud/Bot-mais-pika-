'use client'

import { useSyncExternalStore } from 'react'

/**
 * Estado global "Ver por dentro" (spec §15.3): html[data-dentro="on"] + sessionStorage['gg:dentro'].
 * O script inline do <head> aplica o estado antes do primeiro paint.
 */
const EVENTO = 'gg:dentro'

/** O botão que ligou a vista: é para ele que o foco volta quando a pílula desliga. */
let origem: HTMLElement | null = null

function ler() {
  return document.documentElement.dataset.dentro === 'on'
}
function assinar(cb: () => void) {
  window.addEventListener(EVENTO, cb)
  return () => window.removeEventListener(EVENTO, cb)
}

export function useDentro() {
  return useSyncExternalStore(assinar, ler, () => false)
}

export function definirDentro(ligado: boolean, quem?: HTMLElement | null) {
  const d = document.documentElement
  if (ligado && quem) origem = quem
  if (ligado) d.dataset.dentro = 'on'
  else delete d.dataset.dentro
  try {
    if (ligado) sessionStorage.setItem('gg:dentro', '1')
    else sessionStorage.removeItem('gg:dentro')
  } catch {
    /* armazenamento indisponível: o estado vale só para esta página */
  }
  window.dispatchEvent(new Event(EVENTO))
  const anuncio = document.getElementById('anuncio-dentro')
  if (anuncio) anuncio.textContent = ligado ? 'Vista por dentro ligada.' : 'Vista por dentro desligada.'
}

function focavel(el: HTMLElement | null): el is HTMLElement {
  if (!el || !el.isConnected || el.closest('[inert], [hidden]')) return false
  return typeof el.checkVisibility === 'function' ? el.checkVisibility() : el.getClientRects().length > 0
}

/**
 * Para onde o foco vai quando a pílula desliga a vista (o botão da pílula some junto): o botão que a ligou,
 * se ainda estiver na página e visível; senão o do rodapé (o mesmo controle, logo antes da pílula na ordem
 * de foco); senão #conteudo.
 */
export function alvoAoDesligar(): HTMLElement | null {
  if (focavel(origem)) return origem
  const rodape = document.querySelector<HTMLElement>('footer [data-ver-por-dentro]')
  if (focavel(rodape)) return rodape
  return document.getElementById('conteudo')
}
