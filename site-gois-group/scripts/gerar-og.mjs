#!/usr/bin/env node
/**
 * Gera public/og/default.png (1200 × 630), a imagem de Open Graph e do X (spec §18.2, §3).
 *
 * Tipográfica, como o hero em repouso: fundo breu; o H1 "Construímos sites de dentro para fora." em
 * Archivo 620, em três linhas, à esquerda do corte; a linha do corte em Rubrica na borda esquerda da
 * coluna 10, saindo da fenda do símbolo de 96 px; à direita do corte, do lado da estrutura, a assinatura:
 * wordmark e tagline "A estrutura por trás do que aparece.".
 *
 * Tudo vem das fontes do projeto: a copy de content/site.ts, o símbolo de components/marca/Simbolo.tsx, o
 * wordmark de public/marca/wordmark.svg, as cores de styles/tokens.css e a Archivo de node_modules
 * (arquivo wght, o mesmo do site). O corpo do H1 é o maior que cabe antes do corte; a posição vertical é
 * medida na linha de base, não estimada. Gerada uma vez e commitada: rode de novo só se algo disso mudar.
 *
 * Usa o Playwright do ambiente (/opt/node22/lib/node_modules/playwright) ou o pacote `playwright`, se
 * instalado. Não é dependência do site.
 *
 * Uso: node scripts/gerar-og.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ler = rel => readFileSync(resolve(raiz, rel), 'utf8')

async function carregarPlaywright() {
  for (const origem of ['/opt/node22/lib/node_modules/playwright/index.mjs', 'playwright']) {
    try {
      return await import(origem)
    } catch {}
  }
  throw new Error('gerar-og: Playwright não encontrado. Instale com `npx playwright install chromium` e `npm i -D playwright` (só para gerar a imagem).')
}

/* ── fontes do projeto ────────────────────────────────────────────────────── */

const site = ler('content/site.ts')
const copia = chave => {
  const m = site.match(new RegExp(`\\b${chave}:\\s*'([^']+)'`))
  if (!m) throw new Error(`gerar-og: não encontrei "${chave}" em content/site.ts`)
  return m[1]
}
const HEADLINE = copia('headline')
const TAGLINE = copia('tagline')
// o H1 do hero em três linhas (spec §4.2): "Construímos sites / de dentro / para fora."
const LINHAS = HEADLINE.match(/^(.+?\bsites)\s+(de dentro)\s+(para fora\.)$/)?.slice(1)
if (!LINHAS) throw new Error(`gerar-og: a headline mudou ("${HEADLINE}"); revise a quebra em três linhas`)

const tokens = ler('styles/tokens.css')
const cor = nome => {
  const m = tokens.match(new RegExp(`--${nome}\\s*:\\s*(#[0-9a-fA-F]{6})`))
  if (!m) throw new Error(`gerar-og: token --${nome} não encontrado em styles/tokens.css`)
  return m[1].toUpperCase()
}
const BREU = cor('breu')
const GIZ = cor('giz')
const CINZA_2 = cor('cinza-2')
const RUBRICA = cor('rubrica')

const simbolo = ler('components/marca/Simbolo.tsx').match(/const MESTRE = \(\s*<>([\s\S]*?)<\/>/)
const CAMINHOS = simbolo ? [...simbolo[1].matchAll(/d="([^"]+)"/g)].map(m => m[1]) : []
if (CAMINHOS.length !== 2) throw new Error('gerar-og: símbolo mestre não encontrado em components/marca/Simbolo.tsx')

const wordmark = ler('public/marca/wordmark.svg')
const WM_VIEWBOX = wordmark.match(/viewBox="([^"]+)"/)?.[1]
const WM_CORPO = wordmark.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
const [, , WM_W, WM_H] = (WM_VIEWBOX ?? '').split(/\s+/).map(Number)
if (!WM_W || !WM_H) throw new Error('gerar-og: viewBox do wordmark não encontrado')

const ARCHIVO = readFileSync(resolve(raiz, 'node_modules/@fontsource-variable/archivo/files/archivo-latin-wght-normal.woff2')).toString('base64')

/* ── composição ───────────────────────────────────────────────────────────── */

const W = 1200
const H = 630
const MARGEM = 64
const GUTTER = 24
const COLUNAS = 12
const COLUNA = (W - 2 * MARGEM - (COLUNAS - 1) * GUTTER) / COLUNAS
// o corte repousa na borda esquerda da coluna 10, como no hero a partir de 1280 px (--col-corte: 10)
const CORTE = Math.round(MARGEM + 9 * (COLUNA + GUTTER))
const SIMBOLO = 96
const FENDA = (30 / 48) * SIMBOLO // centro da fenda (x 28–32 da grade de 48)
const LINHA = 2 // a 1200 px, 2 px: a imagem costuma ser vista pela metade
const VERSAL_WM = 14 // altura de versal do wordmark: legível com a imagem vista pela metade

const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<style>
@font-face { font-family: 'Archivo'; src: url(data:font/woff2;base64,${ARCHIVO}) format('woff2'); font-weight: 100 900; font-display: block; }
* { box-sizing: border-box; }
html, body { margin: 0; background: ${BREU}; }
.og { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; background: ${BREU}; color: ${GIZ};
  font-family: 'Archivo', sans-serif; -webkit-font-smoothing: antialiased; font-kerning: normal; }
.corte { position: absolute; left: ${CORTE}px; top: ${MARGEM}px; bottom: 0; width: 0; }
.corte svg { position: absolute; top: 0; left: ${-FENDA}px; width: ${SIMBOLO}px; height: ${SIMBOLO}px; fill: ${GIZ}; shape-rendering: crispEdges; }
.corte i { position: absolute; top: ${SIMBOLO}px; bottom: 0; left: ${-LINHA / 2}px; width: ${LINHA}px; background: ${RUBRICA}; }
h1 { position: absolute; left: ${MARGEM}px; top: 0; margin: 0; font-weight: 620; line-height: .94; letter-spacing: -.035em;
  font-size: var(--fs); white-space: nowrap; }
h1 span { display: block; }
.base { display: inline-block; width: 0; height: 0; vertical-align: baseline; }
.assinatura { position: absolute; left: ${CORTE + GUTTER}px; right: ${MARGEM}px; top: 0; margin: 0; }
.assinatura svg { display: block; height: ${(VERSAL_WM * WM_H) / 686}px; width: auto; fill: ${GIZ}; margin-bottom: 20px; }
.assinatura p { margin: 0; color: ${CINZA_2}; font-weight: 450; font-size: 24px; line-height: 1.3; letter-spacing: -.005em; text-wrap: balance; }
</style></head>
<body><div class="og">
  <h1><span>${LINHAS[0]}</span><span>${LINHAS[1]}</span><span>${LINHAS[2]}<i class="base"></i></span></h1>
  <div class="corte"><svg viewBox="0 0 48 48" aria-hidden="true">${CAMINHOS.map(d => `<path d="${d}"/>`).join('')}</svg><i></i></div>
  <div class="assinatura"><svg viewBox="${WM_VIEWBOX}" aria-label="Gois Group">${WM_CORPO}</svg><p>${TAGLINE}<i class="base"></i></p></div>
</div></body></html>`

const { chromium } = await carregarPlaywright()
const navegador = await chromium.launch()
try {
  const pagina = await navegador.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })
  await pagina.setContent(html, { waitUntil: 'load' })
  await pagina.evaluate(() => document.fonts.ready)
  const medidas = await pagina.evaluate(
    ({ corte, margem, h }) => {
      if (!document.fonts.check('620 100px Archivo')) throw new Error('a Archivo não carregou')
      const h1 = document.querySelector('h1')
      const linhas = [...h1.querySelectorAll('span')]
      // maior corpo inteiro em que a linha mais longa termina pelo menos 48 px antes do corte
      let fs = 128
      for (; fs > 40; fs--) {
        h1.style.setProperty('--fs', `${fs}px`)
        if (Math.max(...linhas.map(l => l.getBoundingClientRect().width)) <= corte - margem - 48) break
      }
      // linha de base da última linha do H1 e da tagline a `margem` px da base da imagem
      const baseH1 = h1.querySelector('.base').getBoundingClientRect().top
      h1.style.top = `${h - margem - baseH1}px`
      const assinatura = document.querySelector('.assinatura')
      const baseAss = assinatura.querySelector('.base').getBoundingClientRect().top
      assinatura.style.top = `${h - margem - baseAss}px`
      const direita = Math.max(...linhas.map(l => l.getBoundingClientRect().right))
      return { fs, direita: Math.round(direita) }
    },
    { corte: CORTE, margem: MARGEM, h: H },
  )
  if (medidas.direita >= CORTE) throw new Error(`gerar-og: o H1 cruza o corte (termina em x ${medidas.direita}; corte em x ${CORTE})`)
  const destino = resolve(raiz, 'public/og/default.png')
  mkdirSync(dirname(destino), { recursive: true })
  const imagem = await pagina.screenshot({ type: 'png', clip: { x: 0, y: 0, width: W, height: H } })
  writeFileSync(destino, imagem)
  console.log(
    `gerar-og: public/og/default.png · ${W}×${H} · ${imagem.length} bytes · H1 ${medidas.fs} px (termina em x ${medidas.direita}; corte em x ${CORTE})`,
  )
} finally {
  await navegador.close()
}
