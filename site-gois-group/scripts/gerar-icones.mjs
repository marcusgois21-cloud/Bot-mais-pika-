#!/usr/bin/env node
/**
 * Gera os ícones do navegador e o logo do JSON-LD a partir do símbolo "G em corte" (spec §5.1, §5.4):
 *
 *   app/icon.svg                  variante hintada de 32, em giz; em tema claro do navegador, breu
 *   app/apple-icon.png            180 × 180, fundo breu, símbolo mestre de 108 px centrado
 *   public/marca/simbolo-512.png  512 × 512, mesma composição (proporção de 60%), para o `logo` do JSON-LD
 *
 * O desenho vem de components/marca/Simbolo.tsx (fonte única): os mesmos `d` do componente. O símbolo só
 * tem arestas retas; a cobertura de cada pixel é calculada de forma exata (área do polígono dentro do
 * pixel), e os tamanhos escolhidos põem todas as arestas em pixel inteiro: 108 = 2,25 px por unidade
 * (módulo de 4 unidades = 9 px) e 312 = 6,5 px por unidade (módulo = 26 px). Resultado nítido, sem
 * serrilhado nem borrão, reproduzível byte a byte. Sem dependências: só node:zlib e node:fs.
 *
 * Uso: node scripts/gerar-icones.mjs
 */
import { deflateSync, crc32 as crc32Nativo } from 'node:zlib'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const BREU = [0x0b, 0x0b, 0x0a]
const GIZ = [0xee, 0xed, 0xe8]
const hex = ([r, g, b]) => `#${[r, g, b].map(c => c.toString(16).padStart(2, '0')).join('').toUpperCase()}`

/* ── desenho: lido do componente ──────────────────────────────────────────── */

const componente = readFileSync(resolve(raiz, 'components/marca/Simbolo.tsx'), 'utf8')
function variante(nome, lado) {
  const bloco = componente.match(new RegExp(`const ${nome} = \\(\\s*<>([\\s\\S]*?)</>`))
  const caminhos = bloco ? [...bloco[1].matchAll(/d="([^"]+)"/g)].map(m => m[1]) : []
  if (caminhos.length !== 2) throw new Error(`gerar-icones: não encontrei as duas peças de ${nome} em components/marca/Simbolo.tsx`)
  return { lado, caminhos }
}
const MESTRE = variante('MESTRE', 48)
const V32 = variante('V32', 32)

/** "M0 0H48V8…Z" (só M, H, V, L e Z, absolutos) em polígonos. */
function poligonos(caminhos) {
  return caminhos.map(d => {
    const pontos = []
    let x = 0
    let y = 0
    for (const [, cmd, args] of d.matchAll(/([MHVLZ])([^MHVLZ]*)/gi)) {
      const n = args.trim() ? args.trim().split(/[\s,]+/).map(Number) : []
      if (cmd === 'M' || cmd === 'L') [x, y] = n
      else if (cmd === 'H') x = n[0]
      else if (cmd === 'V') y = n[0]
      else if (/z/i.test(cmd)) continue
      else throw new Error(`gerar-icones: comando "${cmd}" não suportado em "${d}"`)
      pontos.push([x, y])
    }
    return pontos
  })
}

/**
 * Cobertura exata de polígonos retilíneos (regra par-ímpar) numa grade de W × H pixels.
 * Entre dois y de vértice, os intervalos em x dentro do desenho são constantes: a área dentro de cada
 * pixel é a soma de (altura da faixa ∩ linha do pixel) × (intervalo ∩ coluna do pixel).
 */
function cobertura(polys, escala, dx, dy, W, H) {
  const arestas = []
  for (const pts of polys)
    for (let i = 0; i < pts.length; i++) {
      const [x0, y0] = pts[i]
      const [x1, y1] = pts[(i + 1) % pts.length]
      if (x0 !== x1 && y0 !== y1) throw new Error('gerar-icones: o símbolo só pode ter arestas retas')
      if (x0 === x1 && y0 !== y1) arestas.push({ x: x0 * escala + dx, y0: Math.min(y0, y1) * escala + dy, y1: Math.max(y0, y1) * escala + dy })
    }
  const ys = [...new Set(arestas.flatMap(a => [a.y0, a.y1]))].sort((a, b) => a - b)
  const alfa = new Float64Array(W * H)
  for (let k = 0; k < ys.length - 1; k++) {
    const ya = ys[k]
    const yb = ys[k + 1]
    const xs = arestas
      .filter(a => a.y0 <= ya && a.y1 >= yb)
      .map(a => a.x)
      .sort((a, b) => a - b)
    for (let py = Math.max(0, Math.floor(ya)); py < Math.min(H, Math.ceil(yb)); py++) {
      const h = Math.min(yb, py + 1) - Math.max(ya, py)
      if (h <= 0) continue
      for (let j = 0; j + 1 < xs.length; j += 2) {
        const xa = xs[j]
        const xb = xs[j + 1]
        for (let px = Math.max(0, Math.floor(xa)); px < Math.min(W, Math.ceil(xb)); px++) {
          const w = Math.min(xb, px + 1) - Math.max(xa, px)
          if (w > 0) alfa[py * W + px] += h * w
        }
      }
    }
  }
  return alfa
}

/* ── PNG ──────────────────────────────────────────────────────────────────── */

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

/** PNG de W × H a partir de cores RGB por pixel: paleta quando cabe (1, 2, 4 ou 8 bits), senão RGB. */
function png(W, H, cores) {
  const paleta = [...new Set(cores.map(c => c.join(',')))]
  const indice = new Map(paleta.map((c, i) => [c, i]))
  const indexado = paleta.length <= 256
  const bits = paleta.length <= 2 ? 1 : paleta.length <= 4 ? 2 : paleta.length <= 16 ? 4 : 8
  const bytesPorLinha = indexado ? Math.ceil((W * bits) / 8) : W * 3
  const bruto = Buffer.alloc((bytesPorLinha + 1) * H)
  for (let y = 0; y < H; y++) {
    const inicio = y * (bytesPorLinha + 1)
    for (let x = 0; x < W; x++) {
      const c = cores[y * W + x]
      if (indexado) {
        const bit = x * bits
        bruto[inicio + 1 + (bit >> 3)] |= indice.get(c.join(',')) << (8 - bits - (bit & 7))
      } else bruto.set(c, inicio + 1 + x * 3)
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(W, 0)
  ihdr.writeUInt32BE(H, 4)
  ihdr[8] = indexado ? bits : 8
  ihdr[9] = indexado ? 3 : 2
  const partes = [Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), bloco('IHDR', ihdr)]
  if (indexado) partes.push(bloco('PLTE', Buffer.from(paleta.flatMap(c => c.split(',').map(Number)))))
  partes.push(bloco('IDAT', deflateSync(bruto, { level: 9, memLevel: 9 })), bloco('IEND', Buffer.alloc(0)))
  return Buffer.concat(partes)
}

/** Símbolo em giz, centrado sobre breu. */
function quadro(lado, simbolo) {
  const escala = simbolo / MESTRE.lado
  const deslocamento = (lado - simbolo) / 2
  const alfa = cobertura(poligonos(MESTRE.caminhos), escala, deslocamento, deslocamento, lado, lado)
  const cores = Array.from(alfa, a => {
    const t = Math.min(1, Math.max(0, a))
    return BREU.map((b, i) => Math.round(b + (GIZ[i] - b) * t))
  })
  return png(lado, lado, cores)
}

function gravar(relativo, conteudo) {
  const destino = resolve(raiz, relativo)
  mkdirSync(dirname(destino), { recursive: true })
  writeFileSync(destino, conteudo)
  console.log(`gerar-icones: ${relativo} · ${conteudo.length} bytes`)
}

/* app/icon.svg: a variante de 32 (arestas no pixel a 32 px); o navegador em tema claro recebe breu. */
const icone =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${V32.lado} ${V32.lado}" width="${V32.lado}" height="${V32.lado}" shape-rendering="crispEdges">` +
  `<style>path{fill:${hex(GIZ)}}@media (prefers-color-scheme: light){path{fill:${hex(BREU)}}}</style>` +
  V32.caminhos.map(d => `<path d="${d}"/>`).join('') +
  '</svg>\n'
gravar('app/icon.svg', icone)
gravar('app/apple-icon.png', quadro(180, 108))
gravar('public/marca/simbolo-512.png', quadro(512, 312))
