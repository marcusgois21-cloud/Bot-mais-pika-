#!/usr/bin/env node
/**
 * Deriva valores publicados no site a partir de styles/tokens.css (spec §11.2) — nada digitado à mão.
 * Grava content/generated/derivados.json: contraste do botão primário (--btn-fg sobre --btn-bg) e altura (--control-h).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const css = fs.readFileSync(path.join(raiz, 'styles/tokens.css'), 'utf8')
// só o primeiro bloco :root (o tema escuro padrão)
const bloco = css.slice(css.indexOf(':root {'), css.indexOf('\n}', css.indexOf(':root {')))
const vars = Object.fromEntries([...bloco.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)].map(m => [m[1], m[2].trim()]))

function resolver(nome, profundidade = 0) {
  const v = vars[nome]
  if (!v || profundidade > 8) throw new Error(`token --${nome} não encontrado`)
  const ref = v.match(/^var\(--([\w-]+)\)$/)
  return ref ? resolver(ref[1], profundidade + 1) : v
}
function rgb(hex) {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.replace(/./g, c => c + c) : h
  return [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16))
}
function lum([r, g, b]) {
  const c = x => ((x /= 255) <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)
  return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b)
}
function contraste(a, b) {
  const [l1, l2] = [lum(rgb(a)), lum(rgb(b))].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

const fg = resolver('btn-fg')
const bg = resolver('btn-bg')
const alturaPx = parseFloat(resolver('control-h'))
const derivados = {
  botaoPrimario: {
    contraste: Math.round(contraste(fg, bg) * 100) / 100,
    altura: alturaPx,
    fg,
    bg,
  },
  fonte: 'scripts/derive-tokens.mjs a partir de styles/tokens.css',
}
fs.mkdirSync(path.join(raiz, 'content/generated'), { recursive: true })
fs.writeFileSync(path.join(raiz, 'content/generated/derivados.json'), JSON.stringify(derivados, null, 2) + '\n')
console.log(`derive-tokens: contraste ${derivados.botaoPrimario.contraste}:1 · altura ${alturaPx} px`)
