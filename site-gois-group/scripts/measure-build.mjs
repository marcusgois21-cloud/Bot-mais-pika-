#!/usr/bin/env node
/**
 * Métricas de build do Case Nº 000 (spec §13.4). Roda no `postbuild`, depois do export estático.
 *
 * 1. Lê out/index.html e coleta o que a página inicial carrega na primeira visita:
 *    script[src] (exceto nomodule, que navegador moderno não baixa), link[rel=stylesheet],
 *    link[rel=preload][as=font] e as fontes referenciadas por url() dentro do CSS.
 * 2. Aplica gzip nível 9 (zlib) em cada arquivo, inclusive no próprio HTML.
 * 3. Grava out/metrics.json no formato da spec — e a lista `arquivos`, para que cada número possa ser
 *    conferido arquivo por arquivo.
 *
 * Nenhum número é digitado: se out/index.html não existir, o script falha e não grava nada.
 */
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import zlib from 'node:zlib'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(RAIZ, 'out')
const HTML = path.join(OUT, 'index.html')
const DESTINO = path.join(OUT, 'metrics.json')

// Mesmos textos exibidos na página do case (content/copy/cases.ts) — mudar um exige mudar o outro.
const METODO = 'gzip -9 dos arquivos que a página inicial carrega'
const GERADOR = 'scripts/measure-build.mjs'

function falhar(msg) {
  console.error(`measure-build: ${msg}`)
  process.exit(1)
}

if (!fs.existsSync(HTML)) falhar('out/index.html não encontrado — rode `next build` antes.')

/** Carimbo gravado pelo next.config.ts neste build (mesma data e hash do site). */
const CARIMBO = (() => {
  try {
    return JSON.parse(fs.readFileSync(path.join(RAIZ, '.next/gg-build.json'), 'utf8'))
  } catch {
    return null
  }
})()

/** Mesma regra do next.config.ts: carimbo do build, variável de ambiente, senão o commit atual, senão "local". */
function hashDoBuild() {
  if (CARIMBO?.sha) return CARIMBO.sha
  if (process.env.NEXT_PUBLIC_BUILD_SHA) return process.env.NEXT_PUBLIC_BUILD_SHA
  try {
    return execSync('git rev-parse --short HEAD', { cwd: RAIZ, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return 'local'
  }
}
/** Data do build: a variável de ambiente, se definida; senão, quando o export gravou a página inicial. */
function dataDoBuild() {
  if (CARIMBO?.date && !Number.isNaN(Date.parse(CARIMBO.date))) return new Date(CARIMBO.date).toISOString()
  const env = process.env.NEXT_PUBLIC_BUILD_DATE
  if (env && !Number.isNaN(Date.parse(env))) return new Date(env).toISOString()
  return fs.statSync(HTML).mtime.toISOString()
}

/** Atributos de uma tag HTML (valores com aspas duplas, simples ou sem aspas; booleanos viram ''). */
function atributos(tag) {
  const attrs = {}
  const re = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g
  const corpo = tag.replace(/^<\w+/, '').replace(/\/?>$/, '')
  let m
  while ((m = re.exec(corpo))) attrs[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? ''
  return attrs
}

/** URL do site para o arquivo em out/. Ignora o que não é deste site. */
function arquivoLocal(href, base = '/') {
  let u
  try {
    u = new URL(href, `https://site.local${base}`)
  } catch {
    return null
  }
  if (u.host !== 'site.local') return null
  const p = path.join(OUT, decodeURIComponent(u.pathname))
  return p.startsWith(OUT) && fs.existsSync(p) && fs.statSync(p).isFile() ? p : null
}

const html = fs.readFileSync(HTML, 'utf8')
/** caminho publicado e tipo. Um Map para não contar duas vezes o mesmo arquivo (preload + script). */
const coletados = new Map()
const adicionar = (arquivo, tipo) => {
  if (arquivo && !coletados.has(arquivo)) coletados.set(arquivo, tipo)
}

for (const [tag] of html.matchAll(/<script\b[^>]*>/gi)) {
  const a = atributos(tag)
  if (!a.src || 'nomodule' in a) continue
  adicionar(arquivoLocal(a.src), 'js')
}
for (const [tag] of html.matchAll(/<link\b[^>]*>/gi)) {
  const a = atributos(tag)
  const rel = (a.rel || '').toLowerCase().split(/\s+/)
  if (!a.href) continue
  if (rel.includes('stylesheet')) adicionar(arquivoLocal(a.href), 'css')
  else if (rel.includes('preload') && (a.as || '').toLowerCase() === 'font') adicionar(arquivoLocal(a.href), 'fonte')
}
// Fontes referenciadas dentro do CSS (@font-face src: url(...)).
for (const [arquivo, tipo] of [...coletados]) {
  if (tipo !== 'css') continue
  const css = fs.readFileSync(arquivo, 'utf8')
  const base = '/' + path.relative(OUT, arquivo).split(path.sep).join('/')
  for (const m of css.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi)) {
    if (!/\.(woff2?|ttf|otf)(\?|#|$)/i.test(m[2])) continue
    adicionar(arquivoLocal(m[2], base), 'fonte')
  }
}

const gz = buf => zlib.gzipSync(buf, { level: 9 }).length
const kb = bytes => Math.round((bytes / 1024) * 10) / 10

const htmlBuf = fs.readFileSync(HTML)
const arquivos = [
  { caminho: '/index.html', tipo: 'html', bytes: htmlBuf.length, gzip: gz(htmlBuf) },
  ...[...coletados].map(([arquivo, tipo]) => {
    const buf = fs.readFileSync(arquivo)
    return { caminho: '/' + path.relative(OUT, arquivo).split(path.sep).join('/'), tipo, bytes: buf.length, gzip: gz(buf) }
  }),
]

const soma = tipo => arquivos.filter(a => !tipo || a.tipo === tipo).reduce((t, a) => t + a.gzip, 0)
const metricas = {
  build: { hash: hashDoBuild(), data: dataDoBuild() },
  home: {
    htmlKB: kb(soma('html')),
    cssKB: kb(soma('css')),
    jsKB: kb(soma('js')),
    fontesKB: kb(soma('fonte')),
    totalKB: kb(soma()),
    requisicoes: arquivos.length,
  },
  metodo: METODO,
  gerador: GERADOR,
  arquivos,
}

fs.writeFileSync(DESTINO, JSON.stringify(metricas, null, 2) + '\n')
const h = metricas.home
console.log(
  `measure-build: página inicial ${h.totalKB} KB gz (html ${h.htmlKB} · css ${h.cssKB} · js ${h.jsKB} · fontes ${h.fontesKB}) · ${h.requisicoes} requisições · versão ${metricas.build.hash}, gravado em out/metrics.json`,
)
