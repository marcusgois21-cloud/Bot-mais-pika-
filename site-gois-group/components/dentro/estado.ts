'use client'

import { useSyncExternalStore } from 'react'

/**
 * Estado global "Ver por dentro" (spec §15.3): html[data-dentro="on"] + sessionStorage['gg:dentro'].
 * O script inline do <head> aplica o estado antes do primeiro paint.
 */
const EVENTO = 'gg:dentro'

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

export function definirDentro(ligado: boolean) {
  const d = document.documentElement
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
