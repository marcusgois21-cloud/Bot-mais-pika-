#!/usr/bin/env node
/**
 * Gera public/textura/ruido.png (spec §4.4 e §6.1): ruído de 96 × 96 px, cerca de 2 KB, que vive só no
 * fundo do hero. A opacidade de 2,5% já vem dentro do arquivo (alfa 6/255 em cada pixel), porque uma
 * camada de `background` não tem opacidade própria. Assim o ruído entra direto em
 * `background: var(--luz-hero), url(/textura/ruido.png) repeat, var(--bg)`, sem camada extra.
 *
 * Formato: PNG indexado de 2 bits (quatro cinzas: 0, 85, 170, 255, sorteados em distribuição binomial)
 * com tRNS. Semente fixa: o arquivo é reproduzível byte a byte. Sem dependências: só `node:zlib` e `node:fs`.
 *
 * Uso: node scripts/gerar-ruido.mjs
 */
import { deflateSync, crc32 as crc32Nativo } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const LADO = 96
const ALFA = Math.round(0.025 * 255) // 2,5%
const CINZAS = [0, 85, 170, 255]
const SEMENTE = 0x9e3779b9

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const destino = resolve(raiz, 'public/textura/ruido.png')

// mulberry32: PRNG pequeno e determinístico
function prng(semente) {
  let a = semente >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// CRC-32 do PNG: usa o nativo quando existe (Node ≥ 20.15), senão a tabela clássica.
const TABELA = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
function crc32(buf) {
  if (typeof crc32Nativo === 'function') return crc32Nativo(buf) >>> 0
  let c = 0xffffffff
  for (const b of buf) c = TABELA[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function bloco(tipo, dados) {
  const tam = Buffer.alloc(4)
  tam.writeUInt32BE(dados.length)
  const corpo = Buffer.concat([Buffer.from(tipo, 'latin1'), dados])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(corpo))
  return Buffer.concat([tam, corpo, crc])
}

const aleatorio = prng(SEMENTE)
const bytesPorLinha = (LADO * 2) / 8
const bruto = Buffer.alloc((bytesPorLinha + 1) * LADO)
for (let y = 0; y < LADO; y++) {
  const inicio = y * (bytesPorLinha + 1)
  bruto[inicio] = 0 // filtro: nenhum
  for (let x = 0; x < LADO; x++) {
    // binomial (três moedas): 1/8 · 3/8 · 3/8 · 1/8 — grão de distribuição quase normal, e comprime melhor
    const indice = (aleatorio() < 0.5 ? 1 : 0) + (aleatorio() < 0.5 ? 1 : 0) + (aleatorio() < 0.5 ? 1 : 0)
    const byte = inicio + 1 + (x >> 2)
    bruto[byte] |= indice << (6 - 2 * (x & 3))
  }
}

const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(LADO, 0)
ihdr.writeUInt32BE(LADO, 4)
ihdr[8] = 2 // profundidade: 2 bits
ihdr[9] = 3 // tipo de cor: indexado
ihdr[10] = 0
ihdr[11] = 0
ihdr[12] = 0

const plte = Buffer.from(CINZAS.flatMap(g => [g, g, g]))
const trns = Buffer.from(CINZAS.map(() => ALFA))

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  bloco('IHDR', ihdr),
  bloco('PLTE', plte),
  bloco('tRNS', trns),
  bloco('IDAT', deflateSync(bruto, { level: 9, memLevel: 9 })),
  bloco('IEND', Buffer.alloc(0)),
])

mkdirSync(dirname(destino), { recursive: true })
writeFileSync(destino, png)
console.log(`gerar-ruido: ${destino.replace(raiz + '/', '')} · ${LADO}×${LADO} · ${png.length} bytes · alfa ${ALFA}/255`)
