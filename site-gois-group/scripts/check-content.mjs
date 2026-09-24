#!/usr/bin/env node
/**
 * Gates de conteúdo do site da Gois Group (spec §21.3). Roda no `prebuild` e em `npm run pendencias`.
 *
 *   node scripts/check-content.mjs            relatório curto; interrompe o build quando há falha
 *   node scripts/check-content.mjs --listar   checklist em Markdown de todos os [PENDENTE] e [VALIDAR], por arquivo
 *
 * Dois modos (spec §7.2, §21.5):
 *   produção     NEXT_PUBLIC_SITE_ENV=production: todo bloqueio de publicação interrompe o build.
 *   homologação  qualquer outro valor: só falham as regras que valem para os dois modos; o resto é aviso.
 *
 * Regras (tabela de §21.3; as marcadas com * são de coerência e não estão na tabela):
 *   regra                                                      homologação  produção
 *   validar(…) sem aprovado true                               lista        falha
 *   Medida com valor e sem fonte, período ou verificadoEm      falha        falha
 *   métrica de case com valor e sem fonte, período ou método   falha        falha
 *   placeholder com publicar: true                             falha        falha
 *  *entidade publicada sem nome (empresa) ou título (case)     falha        falha
 *   nenhum canal de contato (e-mail ou endpoint)               aviso        falha
 *   NEXT_PUBLIC_SITE_URL ausente                               aviso        falha
 *   privacidade não publicada, ou com dado pendente            aviso        falha
 *   mais de 3 espaços reservados numa página                   falha        falha
 *   caracteres que não existem nas fontes do site              falha        falha
 *     (setas U+2190, U+2192 e U+2197; U+2264; círculos U+25CB, U+25CF e U+25D0; U+2116; U+202F)
 *   palavras vetadas pela voz da marca (§3)                    aviso        falha
 *  *NEXT_PUBLIC_SHOW_PENDING=1 num build de produção           -            falha
 *  *unidade separada por espaço comum (use U+00A0)             aviso        aviso
 *
 * Como lê o conteúdo:
 *   1. Leitura estática, sem executar nada, de content/, components/, app/, lib/ e hooks/ (.ts, .tsx e .css):
 *      chamadas validar() e pending(), textos (strings, texto de JSX e atributos), caracteres e palavras.
 *   2. Execução dos módulos de content/ com o type stripping do Node (22.6 ou mais recente): os valores reais —
 *      medidas, placeholders, espaços reservados, privacidade — e o texto exato de cada pendência, com a linha
 *      de onde saiu. Sem type stripping, as regras de dados caem para a leitura estática.
 *
 * Lê também .env.production.local, .env.local, .env.production e .env, na mesma ordem do `next build`.
 * Um uso literal e necessário de palavra vetada pode ser liberado com o comentário `check-content: ignorar`
 * na mesma linha ou na linha de cima. Caractere fora da fonte não tem liberação.
 *
 * Sem dependências: só módulos do Node. Exporta as rotinas de leitura para scripts/checar-sinais.mjs.
 */
import fs from 'node:fs'
import path from 'node:path'
import util from 'node:util'
import { spawnSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const relativo = p => path.relative(RAIZ, p).split(path.sep).join('/')

/* ── saída ─────────────────────────────────────────────────────────────────── */

const COR = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR
const pintar = codigo => s => (COR ? `\x1b[${codigo}m${s}\x1b[0m` : String(s))
const negrito = pintar('1')
const vermelho = pintar('31')
const amarelo = pintar('33')
const verde = pintar('32')
const apagado = pintar('2')

/* ── ambiente ──────────────────────────────────────────────────────────────── */

/**
 * Carrega os arquivos .env na mesma ordem e com a mesma precedência do `next build` (NODE_ENV=production):
 * o ambiente real vence; entre os arquivos, vence o primeiro que define a variável.
 */
export function carregarEnv(raiz = RAIZ) {
  const lidos = []
  for (const nome of ['.env.production.local', '.env.local', '.env.production', '.env']) {
    const arquivo = path.join(raiz, nome)
    if (!fs.existsSync(arquivo)) continue
    const texto = fs.readFileSync(arquivo, 'utf8')
    const vars = typeof util.parseEnv === 'function' ? util.parseEnv(texto) : lerEnvSimples(texto)
    for (const [chave, valor] of Object.entries(vars)) if (process.env[chave] === undefined) process.env[chave] = valor
    lidos.push(nome)
  }
  return lidos
}
function lerEnvSimples(texto) {
  const vars = {}
  for (const linha of texto.split(/\r?\n/)) {
    const m = linha.match(/^\s*(?:export\s+)?([\w.-]+)\s*=\s*(.*?)\s*$/)
    if (!m) continue
    let v = m[2]
    if (/^(['"`]).*\1$/.test(v)) v = v.slice(1, -1)
    else v = v.replace(/\s+#.*$/, '')
    vars[m[1]] = v
  }
  return vars
}

/** Garante o type stripping do Node: nativo a partir do 22.18 e do 23.6; com a flag, a partir do 22.6. */
export function garantirTypeStripping() {
  if (process.features?.typescript || process.execArgv.includes('--experimental-strip-types')) return true
  const [maior, menor] = process.versions.node.split('.').map(Number)
  const comFlag = maior > 22 || (maior === 22 && menor >= 6)
  if (comFlag && !process.env.GG_TYPE_STRIPPING) {
    const r = spawnSync(
      process.execPath,
      ['--experimental-strip-types', '--disable-warning=ExperimentalWarning', ...process.argv.slice(1)],
      { stdio: 'inherit', env: { ...process.env, GG_TYPE_STRIPPING: '1' } },
    )
    process.exit(r.status ?? 1)
  }
  return false
}

/* ── listas das regras ─────────────────────────────────────────────────────── */

/** Caracteres ausentes nas duas fontes do site (spec §4.2), com a troca certa. */
const PROIBIDOS = new Map([
  ['\u2192', ['U+2192', 'seta para a direita', 'use o ícone Seta/Icone em SVG']],
  ['\u2190', ['U+2190', 'seta para a esquerda', 'use o ícone Seta/Icone em SVG']],
  ['\u2197', ['U+2197', 'seta diagonal', 'use o ícone "externo" em SVG']],
  ['\u2264', ['U+2264', 'menor ou igual', 'escreva "até"']],
  ['\u25CF', ['U+25CF', 'círculo cheio', 'use o StatusMarcador em SVG']],
  ['\u25CB', ['U+25CB', 'círculo vazio', 'use o StatusMarcador em SVG']],
  ['\u25D0', ['U+25D0', 'círculo meio cheio', 'use o StatusMarcador em SVG']],
  ['\u2116', ['U+2116', 'sinal de numeral', 'escreva "Nº"']],
  ['\u202F', ['U+202F', 'espaço fino inseparável', 'use U+00A0 (NBSP, em lib/formatar)']],
])
const RE_PROIBIDOS = new RegExp(`[${[...PROIBIDOS.keys()].join('')}]`, 'g')

/** Palavra inteira, com fronteira Unicode (o \b do JavaScript não enxerga acento). */
const palavra = fonte => new RegExp(`(?<![\\p{L}\\p{N}_])(?:${fonte})(?![\\p{L}\\p{N}_])`, 'giu')

/** Voz da marca (spec §3): vocabulário vetado e metáforas fora do orçamento. */
const VETADAS = [
  ['soluções', 'soluç(?:ão|ões)'],
  ['inovação', 'inova(?:ção|ções|dor|dora|dores|doras|r|mos|ndo)'],
  ['excelência', 'excelência'],
  ['transformar', 'transforma(?:r|mos|m|ção|ções|ndo|do|da|dos|das|dor|dora|dores)?'],
  ['impulsionar', 'impulsion(?:ar|a|amos|am|ando|ado|ada|ados|adas)'],
  ['apaixonados', 'apaixonad[oa]s?'],
  ['sob medida', 'sob\\s+medida'],
  ['personalizado', 'personalizad[oa]s?|personaliza(?:r|mos|ção|ções)'],
  ['sinergia', 'sinergias?'],
  ['disruptivo', 'disruptiv[oa]s?|disrupção'],
  ['"próximo nível"', 'próximo\\s+nível'],
  ['"de ponta"', 'de\\s+ponta(?!\\s+a\\s+ponta)'],
  [
    'superlativo',
    '(?:o|a|os|as)\\s+melhor(?:es)?|\\p{L}+íssim[oa]s?|líder(?:es)?\\s+(?:de|do|no)\\s+mercado|número\\s+um|incomparáve(?:l|is)|inigualáve(?:l|is)|imbatíve(?:l|is)',
  ],
  ['"toda empresa já é software"', 'toda\\s+empresa\\s+já\\s+é(?:,\\s*em\\s+parte,)?\\s+software'],
  ['"as empresas que vão importar"', 'as\\s+empresas\\s+que\\s+vão\\s+importar'],
  ['"seu sucesso é nosso sucesso"', 'seu\\s+sucesso\\s+é\\s+(?:o\\s+)?nosso\\s+sucesso'],
  ['vocabulário de obra', 'zarcão|subsolo|prancha|carimbo|núcleo\\s+rígido|linha\\s+de\\s+carga|reforço\\s+estrutural'],
  ['vocabulário de cinema', 'storyboard|estreia|plano-sequência'],
  ['verbete de dicionário', 's\\.f\\.'],
].map(([termo, fonte]) => [termo, palavra(fonte)])

/** Número seguido de unidade com espaço comum (spec §4.2: unidade separada por U+00A0). */
const RE_UNIDADE = /(?<=[\d}]) (?:KB|MB|GB|kB|ms|s|px)(?![\p{L}\p{N}_])/gu

/* ── leitura estática ──────────────────────────────────────────────────────── */

const ESPACO = /[\s\uFEFF]/
const DIGITO = /[0-9]/
const ID0 = /[A-Za-z_$\u00C0-\uFFFF]/
const ID = /[\w$\u00C0-\uFFFF]/
const NOME_JSX = /[\w$.:\-\u00C0-\uFFFF]/
const PALAVRAS_CHAVE = new Set(
  ('abstract as async await break case catch class const continue debugger declare default delete do else enum ' +
    'export extends finally for from function if implements import in instanceof interface is keyof let namespace ' +
    'new of private protected public readonly return satisfies static switch throw try type typeof var void while ' +
    'with yield').split(' '),
)
const ANTES_DE_JSX_PALAVRA = new Set(['return', 'yield', 'default', 'else', 'case', 'do', 'await', 'in', 'of'])
const ANTES_DE_JSX_SINAL = new Set(['(', ',', '=', ':', '?', '[', '{', '&', '|', '=>', ';', '!'])

const ENTIDADES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00A0', thinsp: '\u2009', mdash: '\u2014',
  ndash: '\u2013', middot: '\u00B7', hellip: '\u2026', rarr: '\u2192', larr: '\u2190', nearr: '\u2197',
  le: '\u2264', numero: '\u2116', copy: '\u00A9', times: '\u00D7', minus: '\u2212', darr: '\u2193', uarr: '\u2191',
}
function codigoParaTexto(cp) {
  try {
    return String.fromCodePoint(cp)
  } catch {
    return ''
  }
}
function decodificarEntidades(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') return codigoParaTexto(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10))
    return ENTIDADES[e] ?? m
  })
}
const ESCAPES = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', 0: '\0' }
function lerEscape(src, k) {
  const c = src[k + 1]
  if (c === 'u') {
    if (src[k + 2] === '{') {
      const f = src.indexOf('}', k + 3)
      return [codigoParaTexto(parseInt(src.slice(k + 3, f), 16)), f + 1]
    }
    return [codigoParaTexto(parseInt(src.slice(k + 2, k + 6), 16)), k + 6]
  }
  if (c === 'x') return [codigoParaTexto(parseInt(src.slice(k + 2, k + 4), 16)), k + 4]
  if (c === '\r' && src[k + 2] === '\n') return ['', k + 3]
  if (c === '\n' || c === ' ' || c === ' ') return ['', k + 2]
  if (c !== undefined && Object.hasOwn(ESCAPES, c)) return [ESCAPES[c], k + 2]
  return [c ?? '', k + 2]
}

/**
 * Lê um arquivo .ts/.tsx sem executá-lo: strings, templates, texto e atributos de JSX, comentários e as
 * chamadas validar()/pending() com os argumentos. Devolve também uma máscara do código (comentários e
 * conteúdo de strings trocados por espaços, nas mesmas posições) para a análise de objetos literais.
 */
export function escanear(src, { tsx = false } = {}) {
  const n = src.length
  const masc = src.split('')
  const textos = []
  const chamadas = []
  const comentarios = []
  const literais = new Map()
  let ult = null
  let pen = null
  const tok = (t, v) => {
    pen = ult
    ult = { t, v }
  }
  const mascarar = (a, b) => {
    for (let k = a; k < b; k++) if (masc[k] !== '\n' && masc[k] !== '\r') masc[k] = ' '
  }
  const adiante = k => {
    for (;;) {
      while (k < n && ESPACO.test(src[k])) k++
      if (src[k] === '/' && src[k + 1] === '/') {
        const f = src.indexOf('\n', k)
        k = f < 0 ? n : f
        continue
      }
      if (src[k] === '/' && src[k + 1] === '*') {
        const f = src.indexOf('*/', k + 2)
        k = f < 0 ? n : f + 2
        continue
      }
      return k
    }
  }
  const comentario = k => {
    const deLinha = src[k + 1] === '/'
    let f = deLinha ? src.indexOf('\n', k) : src.indexOf('*/', k + 2)
    f = f < 0 ? n : deLinha ? f : f + 2
    comentarios.push({ ini: k, fim: f, texto: src.slice(k, f) })
    mascarar(k, f)
    return f
  }
  const ehImportacao = () =>
    (ult?.t === 'kw' && (ult.v === 'from' || ult.v === 'import')) ||
    (ult?.t === 'p' && ult.v === '(' && ((pen?.t === 'kw' && pen.v === 'import') || (pen?.t === 'id' && pen.v === 'require')))
  const podeRegex = () =>
    !ult || ult.t === 'kw' || (ult.t === 'p' && ult.v !== ')' && ult.v !== ']' && ult.v !== '}')
  const podeJsx = () =>
    !ult || (ult.t === 'p' && ANTES_DE_JSX_SINAL.has(ult.v)) || (ult.t === 'kw' && ANTES_DE_JSX_PALAVRA.has(ult.v))

  function string(k) {
    const q = src[k]
    let f = k + 1
    let valor = ''
    while (f < n && src[f] !== q && src[f] !== '\n') {
      if (src[f] === '\\') {
        const [s, g] = lerEscape(src, f)
        valor += s
        f = g
      } else valor += src[f++]
    }
    f = Math.min(f + 1, n)
    textos.push({ valor, ini: k, fim: f, tipo: 'string', importacao: ehImportacao() })
    literais.set(k, { exibicao: valor, fim: f, expressao: false })
    mascarar(k + 1, f - 1)
    tok('str', valor)
    return f
  }
  function template(k) {
    let f = k + 1
    let parte = ''
    let exibicao = ''
    let texto = ''
    let expressao = false
    while (f < n && src[f] !== '`') {
      if (src[f] === '\\') {
        const [s, g] = lerEscape(src, f)
        parte += s
        f = g
        continue
      }
      if (src[f] === '$' && src[f + 1] === '{') {
        exibicao += parte
        texto += parte
        parte = ''
        const g = codigo(f + 2, true)
        exibicao += `{${src.slice(f + 2, g - 1).trim()}}`
        texto += ' '
        expressao = true
        f = g
        continue
      }
      parte += src[f++]
    }
    exibicao += parte
    texto += parte
    f = Math.min(f + 1, n)
    textos.push({ valor: texto, ini: k, fim: f, tipo: 'template', importacao: false })
    literais.set(k, { exibicao, fim: f, expressao })
    mascarar(k + 1, f - 1)
    tok('str', exibicao)
    return f
  }
  function regex(k) {
    let f = k + 1
    let classe = false
    while (f < n) {
      const c = src[f]
      if (c === '\n') return null
      if (c === '\\') {
        f += 2
        continue
      }
      if (c === '[') classe = true
      else if (c === ']') classe = false
      else if (c === '/' && !classe) break
      f++
    }
    if (f >= n) return null
    f++
    while (f < n && /[a-z]/i.test(src[f])) f++
    mascarar(k + 1, f)
    tok('re', '')
    return f
  }
  function stringJsx(k) {
    const q = src[k]
    const f0 = src.indexOf(q, k + 1)
    const f = f0 < 0 ? n : f0 + 1
    textos.push({ valor: decodificarEntidades(src.slice(k + 1, f - 1)), ini: k, fim: f, tipo: 'atributo', importacao: false })
    mascarar(k + 1, f - 1)
    return f
  }
  function filhos(k, nome) {
    let t0 = k
    const texto = (a, b) => {
      if (b > a && /\S/.test(src.slice(a, b)))
        textos.push({ valor: decodificarEntidades(src.slice(a, b)), ini: a, fim: b, tipo: 'jsx', importacao: false })
      mascarar(a, b)
    }
    while (k < n) {
      const c = src[k]
      if (c === '{') {
        texto(t0, k)
        k = codigo(k + 1, true)
        t0 = k
        continue
      }
      if (c === '<') {
        texto(t0, k)
        if (src[k + 1] === '/') {
          const f = src.indexOf('>', k)
          if (f < 0 || src.slice(k + 2, f).trim() !== nome) return null
          return f + 1
        }
        const f = elemento(k)
        if (f === null) return null
        k = f
        t0 = k
        continue
      }
      k++
    }
    return null
  }
  function elemento(i) {
    let k = i + 1
    if (src[k] === '>') return filhos(k + 1, '')
    if (!ID0.test(src[k] ?? '')) return null
    const a = k
    while (k < n && NOME_JSX.test(src[k])) k++
    const nome = src.slice(a, k)
    for (;;) {
      while (k < n && ESPACO.test(src[k])) k++
      if (k >= n) return null
      const c = src[k]
      if (c === '/' && src[k + 1] === '>') return k + 2
      if (c === '>') return filhos(k + 1, nome)
      if (c === '{') {
        k = codigo(k + 1, true)
        continue
      }
      if (!ID0.test(c)) return null
      while (k < n && NOME_JSX.test(src[k])) k++
      while (k < n && ESPACO.test(src[k])) k++
      if (src[k] !== '=') continue
      k++
      while (k < n && ESPACO.test(src[k])) k++
      const v = src[k]
      if (v === '"' || v === "'") k = stringJsx(k)
      else if (v === '{') k = codigo(k + 1, true)
      else if (v === '<') {
        const f = elemento(k)
        if (f === null) return null
        k = f
      } else return null
    }
  }
  /** `<` pode ser JSX ou operador (genéricos, comparações): tenta JSX e, se não fechar, desfaz tudo. */
  function tentarJsx(i) {
    const salvo = { ult, pen, t: textos.length, c: chamadas.length, co: comentarios.length, masc: masc.slice(i) }
    const f = elemento(i)
    if (f !== null) {
      tok('jsx', '')
      return f
    }
    ult = salvo.ult
    pen = salvo.pen
    textos.length = salvo.t
    chamadas.length = salvo.c
    comentarios.length = salvo.co
    for (const k of [...literais.keys()]) if (k >= i) literais.delete(k)
    for (let k = 0; k < salvo.masc.length; k++) masc[i + k] = salvo.masc[k]
    return null
  }
  function codigo(i, ateFechar) {
    let prof = 0
    while (i < n) {
      const c = src[i]
      if (ESPACO.test(c)) {
        i++
        continue
      }
      if (c === '/' && (src[i + 1] === '/' || src[i + 1] === '*')) {
        i = comentario(i)
        continue
      }
      if (c === '"' || c === "'") {
        i = string(i)
        continue
      }
      if (c === '`') {
        i = template(i)
        continue
      }
      if (c === '{') {
        prof++
        tok('p', '{')
        i++
        continue
      }
      if (c === '}') {
        if (ateFechar && prof === 0) return i + 1
        prof--
        tok('p', '}')
        i++
        continue
      }
      if (c === '/') {
        if (podeRegex()) {
          const f = regex(i)
          if (f !== null) {
            i = f
            continue
          }
        }
        tok('p', '/')
        i++
        continue
      }
      if (c === '<' && tsx && podeJsx()) {
        const f = tentarJsx(i)
        if (f !== null) {
          i = f
          continue
        }
      }
      if (DIGITO.test(c) || (c === '.' && DIGITO.test(src[i + 1] ?? ''))) {
        let f = i + 1
        while (f < n && /[\w.]/.test(src[f])) f++
        tok('num', src.slice(i, f))
        i = f
        continue
      }
      if (ID0.test(c)) {
        const a = i
        while (i < n && ID.test(src[i])) i++
        const id = src.slice(a, i)
        if (PALAVRAS_CHAVE.has(id)) {
          tok('kw', id)
          continue
        }
        const antes = ult
        tok('id', id)
        if ((id === 'validar' || id === 'pending') && !(antes?.t === 'p' && antes.v === '.') && !(antes?.t === 'kw' && antes.v === 'function')) {
          const k = adiante(i)
          if (src[k] === '(') chamadas.push({ nome: id, ini: a, abre: k })
        }
        continue
      }
      if (c === '=' && src[i + 1] === '>') {
        tok('p', '=>')
        i += 2
        continue
      }
      if (c === '?' && src[i + 1] === '.' && !DIGITO.test(src[i + 2] ?? '')) {
        tok('p', '.')
        i += 2
        continue
      }
      tok('p', c)
      i++
    }
    return i
  }

  codigo(0, false)
  const mascara = masc.join('')
  const pular = k => {
    while (k < n && ESPACO.test(mascara[k])) k++
    return k
  }
  const ateFimDoArgumento = (k, pararEmVirgula) => {
    let prof = 0
    while (k < n) {
      const c = mascara[k]
      if (prof === 0 && (c === ')' || (pararEmVirgula && c === ','))) break
      if (c === '(' || c === '[' || c === '{') prof++
      else if (c === ')' || c === ']' || c === '}') prof--
      k++
    }
    return k
  }
  for (const ch of chamadas) {
    let k = pular(ch.abre + 1)
    const lit = literais.get(k)
    if (lit) {
      ch.valor = lit.exibicao
      ch.expressao = lit.expressao
      k = pular(lit.fim)
      if (mascara[k] === ',') {
        const a = k + 1
        k = ateFimDoArgumento(a, true)
        ch.segundo = src.slice(a, k).trim() || null
      } else if (mascara[k] !== ')') {
        ch.composto = true
        ch.valor += ' + …'
      }
    } else {
      const a = k
      k = ateFimDoArgumento(a, true)
      ch.valor = null
      ch.bruto = src.slice(a, k).trim().replace(/\s+/g, ' ')
      if (mascara[k] === ',') ch.segundo = src.slice(k + 1, ateFimDoArgumento(k + 1, true)).trim() || null
    }
  }

  const inicios = [0]
  for (let k = 0; k < n; k++) if (src[k] === '\n') inicios.push(k + 1)
  const linhaDe = pos => {
    let lo = 0
    let hi = inicios.length - 1
    while (lo < hi) {
      const meio = (lo + hi + 1) >> 1
      if (inicios[meio] <= pos) lo = meio
      else hi = meio - 1
    }
    return lo + 1
  }
  const colunaDe = pos => pos - inicios[linhaDe(pos) - 1] + 1
  return { src, textos, chamadas, comentarios, mascara, linhaDe, colunaDe }
}

/**
 * Objetos literais `{ chave: valor, … }` de um arquivo já escaneado, com o texto bruto de cada valor.
 * É uma leitura aproximada (não entende tipos, spreads nem funções): serve de reserva quando o módulo não
 * pode ser executado.
 */
export function objetosLiterais(lido) {
  const { src, mascara } = lido
  const objetos = []
  const pilha = []
  for (let k = 0; k < mascara.length; k++) {
    if (mascara[k] === '{') pilha.push(k)
    else if (mascara[k] === '}' && pilha.length) {
      const a = pilha.pop()
      const props = {}
      let prof = 0
      let s = a + 1
      for (let j = a + 1; j <= k; j++) {
        const c = mascara[j]
        if (j === k || (c === ',' && prof === 0)) {
          // comentários já são espaços na máscara: a chave começa no primeiro caractere visível dela
          const inicio = s + (mascara.slice(s, j).match(/^\s*/)?.[0].length ?? 0)
          const m = src.slice(inicio, j).match(/^['"]?([A-Za-z_$][\w$-]*)['"]?\s*:(?!:)/)
          if (m) props[m[1]] = { bruto: src.slice(inicio + m[0].length, j).trim(), ini: inicio + m[0].length }
          s = j + 1
          continue
        }
        if (c === '(' || c === '[' || c === '{') prof++
        else if (c === ')' || c === ']' || c === '}') prof--
      }
      objetos.push({ ini: a, fim: k + 1, props })
    }
  }
  return objetos
}
/** Valor de um literal simples: boolean, string, número, `pending(…)` ou `undefined` quando é expressão. */
export function valorLiteral(prop) {
  if (!prop) return undefined
  const b = prop.bruto
  if (b === 'true') return true
  if (b === 'false') return false
  if (/^-?\d[\d_]*(\.\d+)?$/.test(b)) return Number(b.replace(/_/g, ''))
  const s = b.match(/^(['"])((?:\\.|(?!\1).)*)\1$/s)
  if (s) return s[2].replace(/\\(.)/g, '$1')
  if (/^pending\s*\(/.test(b)) return { __pending: true, hint: (b.match(/\(\s*(['"`])(.*?)\1/s) ?? [])[2] ?? b }
  return undefined
}

/* ── execução dos módulos de content/ ──────────────────────────────────────── */

/**
 * Hooks de carregamento (rodam fora da thread principal): resolvem o alias `@/`, especificadores sem
 * extensão e JSON; trocam lib/pending.ts e lib/conteudo.ts por um invólucro que registra de onde veio
 * cada pending() e validar() — arquivo e linha — para o checklist.
 */
const HOOKS = String.raw`
import { statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
let RAIZ = ''
export function initialize(dados) { RAIZ = dados.raiz }
const EXTENSOES = ['.ts', '.mts', '.tsx', '.mjs', '.js', '.json']
const ENVOLVER = { 'lib/pending.ts': 'pending', 'lib/conteudo.ts': 'validar' }
function existe(url) { try { return statSync(fileURLToPath(url)).isFile() } catch { return false } }
function completar(base) {
  if (existe(base)) return base
  for (const e of EXTENSOES) if (existe(base + e)) return base + e
  for (const e of EXTENSOES) if (existe(base + '/index' + e)) return base + '/index' + e
  return null
}
export async function resolve(especificador, contexto, proximo) {
  let alvo = null
  if (especificador.startsWith('@/')) alvo = new URL(especificador.slice(2), RAIZ).href
  else if (/^\.\.?\//.test(especificador) && contexto.parentURL && contexto.parentURL.startsWith('file:')) alvo = new URL(especificador, contexto.parentURL).href
  else if (especificador.startsWith('file:')) alvo = especificador
  if (!alvo) return proximo(especificador, contexto)
  const q = alvo.indexOf('?')
  const base = q < 0 ? alvo : alvo.slice(0, q)
  const busca = q < 0 ? '' : alvo.slice(q)
  const url = completar(base)
  if (!url) return proximo(especificador, contexto)
  if (url.endsWith('.json')) return { url, format: 'json', importAttributes: { type: 'json' }, shortCircuit: true }
  if (/\.(css|scss|svg|png|jpe?g|webp|avif|woff2?)$/.test(url)) return { url: 'data:text/javascript,export default {}', format: 'module', shortCircuit: true }
  if (url.endsWith('.tsx')) throw new Error('importa um componente .tsx, que o Node não executa: ' + url.slice(RAIZ.length))
  const rel = url.startsWith(RAIZ) ? url.slice(RAIZ.length) : ''
  if (ENVOLVER[rel] && busca !== '?gg=real') return { url: url + '?gg=envolver', format: 'module', shortCircuit: true }
  if (/\.m?ts$/.test(url)) return { url: url + busca, format: 'module-typescript', shortCircuit: true }
  return proximo(url + busca, contexto)
}
export async function load(url, contexto, proximo) {
  if (url.endsWith('?gg=envolver')) {
    const real = url.replace('?gg=envolver', '?gg=real')
    const nome = ENVOLVER[url.slice(RAIZ.length).replace('?gg=envolver', '')]
    const fonte = [
      'import * as real from ' + JSON.stringify(real) + ';',
      'export * from ' + JSON.stringify(real) + ';',
      'export const ' + nome + ' = (...args) => {',
      '  const valor = real.' + nome + '(...args);',
      '  globalThis.__ggCheckContent?.registrar(' + JSON.stringify(nome) + ', valor, new Error().stack);',
      '  return valor;',
      '};',
    ].join('\n')
    return { format: 'module', source: fonte, shortCircuit: true }
  }
  return proximo(url, contexto)
}
`

let hooksRegistrados = false
function origemDaPilha(pilha, raiz) {
  for (const linha of String(pilha).split('\n').slice(1)) {
    const m = linha.match(/(file:\/\/[^\s()]+?):(\d+):(\d+)\)?\s*$/)
    if (!m || m[1].includes('?gg=')) continue
    try {
      return { arquivo: path.relative(raiz, fileURLToPath(m[1])).split(path.sep).join('/'), linha: Number(m[2]) }
    } catch {
      continue
    }
  }
  return null
}

/**
 * Executa os módulos de content/ (type stripping do Node) e devolve os exports de cada um, os erros e o
 * registro de cada pending()/validar() chamado durante a execução, com arquivo e linha.
 */
export async function avaliarConteudo(arquivos, raiz = RAIZ) {
  const typescript = process.features?.typescript || process.execArgv.includes('--experimental-strip-types')
  if (!typescript) return { disponivel: false, motivo: `Node ${process.version} sem type stripping`, modulos: new Map(), erros: new Map() }
  const registro = { pendentes: [], validacoes: [], origem: new WeakMap() }
  globalThis.__ggCheckContent = {
    registrar(tipo, valor, pilha) {
      const origem = origemDaPilha(pilha, raiz)
      if (origem && valor && typeof valor === 'object') registro.origem.set(valor, origem)
      if (tipo === 'pending') registro.pendentes.push({ hint: valor?.hint, ...origem })
      else registro.validacoes.push({ texto: valor?.texto, aprovado: valor?.aprovado === true, ...origem })
    },
  }
  if (!hooksRegistrados) {
    const { register } = await import('node:module')
    register(`data:text/javascript,${encodeURIComponent(HOOKS)}`, import.meta.url, {
      data: { raiz: pathToFileURL(raiz + path.sep).href },
    })
    hooksRegistrados = true
  }
  const modulos = new Map()
  const erros = new Map()
  for (const arquivo of arquivos) {
    try {
      modulos.set(arquivo, await import(pathToFileURL(path.join(raiz, arquivo)).href))
    } catch (e) {
      const msg = String(e?.message ?? e).split('\n')[0]
      erros.set(arquivo, msg.replace(pathToFileURL(raiz).href + '/', ''))
    }
  }
  return { disponivel: true, modulos, erros, registro }
}

/* ── utilidades de dados ───────────────────────────────────────────────────── */

export const ehPendente = v => typeof v === 'object' && v !== null && v.__pending === true
const ehValidar = v => typeof v === 'object' && v !== null && v.__validar === true
const conhecido = v => v !== undefined && v !== null && !ehPendente(v) && !(typeof v === 'string' && v.trim() === '')
export const ehPublicada = e => e.publicar === true && e.placeholder === false
const ehEntidade = o => typeof o.placeholder === 'boolean' && typeof o.publicar === 'boolean'
const ehEmpresa = o => ehEntidade(o) && typeof o.codigo === 'string' && o.codigo.startsWith('E-')
const ehCaso = o => ehEntidade(o) && typeof o.numero === 'string' && typeof o.capitulos === 'object' && o.capitulos !== null
const ehMedida = o => ['valor', 'fonte', 'periodo', 'verificadoEm'].every(k => Object.hasOwn(o, k))
const ehMetricaDeCase = o => ehMedida(o) && ['antes', 'depois', 'metodo'].every(k => Object.hasOwn(o, k))

function percorrer(raiz, caminho, vistos, visitar) {
  if (raiz === null || typeof raiz !== 'object' || vistos.has(raiz)) return
  vistos.add(raiz)
  if (ehPendente(raiz) || ehValidar(raiz)) return
  visitar(raiz, caminho)
  if (Array.isArray(raiz)) raiz.forEach((v, k) => percorrer(v, `${caminho}[${k}]`, vistos, visitar))
  else for (const [k, v] of Object.entries(raiz)) percorrer(v, caminho ? `${caminho}.${k}` : k, vistos, visitar)
}

/** Todos os arquivos de uma pasta, recursivo, com as extensões pedidas. */
function listar(pasta, extensoes) {
  const abs = path.join(RAIZ, pasta)
  if (!fs.existsSync(abs)) return []
  const saida = []
  for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name === 'node_modules' || e.name === 'generated') continue
    const p = path.join(abs, e.name)
    if (e.isDirectory()) saida.push(...listar(relativo(p), extensoes))
    else if (extensoes.some(x => e.name.endsWith(x)) && !e.name.endsWith('.d.ts')) saida.push(relativo(p))
  }
  return saida.sort((a, b) => a.split('/').length - b.split('/').length || a.localeCompare(b))
}

/* ── coleta ────────────────────────────────────────────────────────────────── */

function novaRegra(regras, id, titulo, homologacao, producao, ajuda) {
  const r = { id, titulo, homologacao, producao, ajuda, itens: [] }
  regras.push(r)
  return r
}

export async function coletar() {
  const envLidos = carregarEnv()
  const env = process.env
  const producao = env.NEXT_PUBLIC_SITE_ENV === 'production'
  const regras = []
  const R = {
    validar: novaRegra(regras, 'validar', 'Compromissos [VALIDAR] sem aprovação', 'lista', 'falha', [
      'Frases de compromisso ou de oferta que a Gois Group precisa confirmar que pratica (spec §0, §22.2).',
      "Para aprovar: validar('…', true). Para não publicar, reescreva ou retire a frase.",
    ]),
    medida: novaRegra(regras, 'medida', 'Número sem fonte, período ou data de verificação', 'falha', 'falha', [
      'Número só com fonte, período e data de verificação (spec §13, §21.2).',
      "Preencha os campos que faltam ou volte o valor para pending('[…]').",
    ]),
    placeholder: novaRegra(regras, 'placeholder', 'Placeholder marcado para publicar', 'falha', 'falha', [
      'Placeholder nunca vai ao ar (spec §7.2): troque os dados pelos reais e marque placeholder: false,',
      'ou volte publicar para false.',
    ]),
    semNome: novaRegra(regras, 'semNome', 'Entidade publicada sem nome ou título', 'falha', 'falha', [
      'Empresa publicada precisa de nome; case publicado precisa de título (spec §9.6, §12).',
    ]),
    canal: novaRegra(regras, 'canal', 'Canal de contato', 'aviso', 'falha', [
      'Defina NEXT_PUBLIC_CONTACT_EMAIL (e-mail exibido no site e envio por mailto) e/ou',
      'NEXT_PUBLIC_CONTACT_ENDPOINT (endereço que recebe o formulário em JSON), no ambiente do deploy',
      'ou em .env.production.local (spec §14.7, §21.5).',
    ]),
    dominio: novaRegra(regras, 'dominio', 'Domínio oficial', 'aviso', 'falha', [
      'Defina NEXT_PUBLIC_SITE_URL com o endereço oficial, com https:// e sem barra final. Ele entra no',
      'canonical, no Open Graph, no JSON-LD e no sitemap (spec §18.2, §21.5).',
    ]),
    privacidade: novaRegra(regras, 'privacidade', 'Política de privacidade', 'aviso', 'falha', [
      'O formulário coleta dados pessoais: a política é obrigatória (LGPD, spec §14.8). Preencha',
      'site.privacidade em content/site.ts e marque publicada: true.',
    ]),
    reservados: novaRegra(regras, 'reservados', 'Mais de 3 espaços reservados numa página', 'falha', 'falha', [
      'No máximo 3 espaços reservados visíveis por página, somando empresas e cases (spec §7.4).',
    ]),
    caracteres: novaRegra(regras, 'caracteres', 'Caracteres que não existem nas fontes do site', 'falha', 'falha', [
      'Archivo e Martian Mono não têm estes glifos (spec §4.2): setas e marcadores são SVG',
      '(Icone, Seta, StatusMarcador); unidades usam U+00A0.',
    ]),
    vetadas: novaRegra(regras, 'vetadas', 'Palavras vetadas pela voz da marca', 'aviso', 'falha', [
      'Vocabulário vetado ou metáfora fora do orçamento (spec §3). Reescreva a frase. Se o uso for literal',
      'e necessário, marque a linha com o comentário "check-content: ignorar".',
    ]),
    showPending: novaRegra(regras, 'showPending', 'Instruções de homologação num build de produção', 'aviso', 'falha', [
      'NEXT_PUBLIC_SHOW_PENDING=1 mostra as instruções entre colchetes e gera as páginas-modelo:',
      'é só para homologação. Remova a variável do ambiente de produção.',
    ]),
    coerencia: novaRegra(regras, 'coerencia', 'Dados a conferir', 'aviso', 'aviso', []),
    unidade: novaRegra(regras, 'unidade', 'Unidade separada por espaço comum', 'aviso', 'aviso', [
      'Unidades se separam do número por U+00A0 (spec §4.2; NBSP em lib/formatar).',
    ]),
    leitura: novaRegra(regras, 'leitura', 'Módulos lidos só de forma estática', 'aviso', 'aviso', [
      'As regras de dados destes arquivos foram conferidas por leitura aproximada.',
    ]),
  }
  const item = (regra, onde, texto) => regra.itens.push({ onde, texto })

  /* ambiente */
  const email = env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() ?? ''
  const endpoint = env.NEXT_PUBLIC_CONTACT_ENDPOINT?.trim() ?? ''
  if (!email && !endpoint) item(R.canal, 'ambiente', 'Nenhum canal definido: nem NEXT_PUBLIC_CONTACT_EMAIL nem NEXT_PUBLIC_CONTACT_ENDPOINT.')
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) item(R.canal, 'ambiente', `NEXT_PUBLIC_CONTACT_EMAIL não parece um e-mail: "${email}".`)
  if (endpoint) {
    let u = null
    try {
      u = new URL(endpoint)
    } catch {}
    if (!u) item(R.canal, 'ambiente', `NEXT_PUBLIC_CONTACT_ENDPOINT não é um endereço válido: "${endpoint}".`)
    else if (u.protocol !== 'https:' && !(u.protocol === 'http:' && /^(localhost|127\.0\.0\.1)$/.test(u.hostname) && !producao))
      item(R.canal, 'ambiente', `NEXT_PUBLIC_CONTACT_ENDPOINT precisa usar https:// ("${endpoint}").`)
  }
  const siteUrl = env.NEXT_PUBLIC_SITE_URL?.trim() ?? ''
  if (!siteUrl) item(R.dominio, 'ambiente', 'NEXT_PUBLIC_SITE_URL não definido: canonical, Open Graph e sitemap usam https://gois-group.example.')
  else {
    let u = null
    try {
      u = new URL(siteUrl)
    } catch {}
    if (!u) item(R.dominio, 'ambiente', `NEXT_PUBLIC_SITE_URL não é um endereço válido: "${siteUrl}".`)
    else {
      if (u.protocol !== 'https:') item(R.dominio, 'ambiente', `NEXT_PUBLIC_SITE_URL precisa usar https:// ("${siteUrl}").`)
      if (/(^|\.)(example|test|invalid|localhost)$/.test(u.hostname) || u.hostname === '127.0.0.1')
        item(R.dominio, 'ambiente', `NEXT_PUBLIC_SITE_URL aponta para um endereço provisório: "${u.hostname}".`)
      if (u.pathname !== '/' || u.search || u.hash)
        item(R.dominio, 'ambiente', `NEXT_PUBLIC_SITE_URL deve ser só o domínio, sem caminho: "${siteUrl}".`)
    }
  }
  if (producao && env.NEXT_PUBLIC_SHOW_PENDING === '1') item(R.showPending, 'ambiente', 'NEXT_PUBLIC_SHOW_PENDING=1 junto com NEXT_PUBLIC_SITE_ENV=production.')
  const siteEnv = env.NEXT_PUBLIC_SITE_ENV
  if (siteEnv && !['production', 'preview'].includes(siteEnv))
    item(R.coerencia, 'ambiente', `NEXT_PUBLIC_SITE_ENV="${siteEnv}" não é "production" nem "preview": tratado como homologação.`)

  /* leitura estática */
  const fontes = [
    ...['content', 'components', 'app', 'lib', 'hooks'].flatMap(p => listar(p, ['.ts', '.tsx', '.mts'])),
  ]
  const folhas = ['components', 'app', 'styles'].flatMap(p => listar(p, ['.css']))
  const lidos = new Map()
  for (const arquivo of fontes) {
    const src = fs.readFileSync(path.join(RAIZ, arquivo), 'utf8')
    lidos.set(arquivo, escanear(src, { tsx: arquivo.endsWith('.tsx') }))
  }
  for (const [arquivo, lido] of lidos) conferirTextos(arquivo, lido, R, item)
  for (const arquivo of folhas) conferirCss(arquivo, fs.readFileSync(path.join(RAIZ, arquivo), 'utf8'), R, item)

  /* execução de content/ */
  const deConteudo = fontes.filter(f => f.startsWith('content/') && /\.m?ts$/.test(f))
  const avaliacao = await avaliarConteudo(deConteudo)
  const executados = new Set([...avaliacao.modulos.keys()])
  if (!avaliacao.disponivel) item(R.leitura, 'ambiente', `${avaliacao.motivo}: use o Node 22.18 ou mais recente para a verificação completa.`)
  for (const [arquivo, erro] of avaliacao.erros) item(R.leitura, arquivo, `não pôde ser executado (${erro}).`)

  const empresas = []
  const casos = []
  let privacidade = null
  const linhaDeObjeto = obj => {
    for (const v of Object.values(obj)) {
      const o = v && typeof v === 'object' ? avaliacao.registro?.origem.get(v) : null
      if (o) return o
    }
    return null
  }
  const vistos = new Set()
  for (const [arquivo, mod] of avaliacao.modulos) {
    for (const [nome, valor] of Object.entries(mod)) {
      percorrer(valor, nome, vistos, (obj, caminho) => {
        const origem = linhaDeObjeto(obj)
        const onde = origem ? `${origem.arquivo}:${origem.linha}` : `${arquivo} (${caminho})`
        const quem = obj.slug ?? obj.id ?? obj.codigo ?? caminho
        if (ehEmpresa(obj)) empresas.push(obj)
        if (ehCaso(obj)) casos.push(obj)
        if (/(^|\.)privacidade$/.test(caminho) && typeof obj.publicada === 'boolean' && !privacidade) privacidade = { obj, arquivo }
        if (ehEntidade(obj) && obj.placeholder && obj.publicar)
          item(R.placeholder, onde, `${quem}: placeholder: true com publicar: true.`)
        if (ehMedida(obj)) {
          const deCase = ehMetricaDeCase(obj)
          const definido = conhecido(obj.valor) || (deCase && (conhecido(obj.antes) || conhecido(obj.depois)))
          if (definido) {
            const campos = ['fonte', 'periodo', 'verificadoEm', ...(deCase ? ['metodo'] : [])]
            const faltam = campos.filter(k => !conhecido(obj[k]))
            const rotulo = typeof obj.rotulo === 'string' ? `"${obj.rotulo}"` : quem
            if (faltam.length) {
              const o = faltam.map(k => avaliacao.registro.origem.get(obj[k])).find(Boolean)
              item(R.medida, o ? `${o.arquivo}:${o.linha}` : onde, `${rotulo} tem valor, mas falta ${juntar(faltam.map(nomeDoCampo))}.`)
            } else if (typeof obj.verificadoEm === 'string' && !/^(\d{4}-(0[1-9]|1[0-2])|build)$/.test(obj.verificadoEm))
              item(R.coerencia, onde, `${rotulo}: verificadoEm "${obj.verificadoEm}" deve estar no formato AAAA-MM.`)
          }
        }
      })
    }
  }
  const unicos = lista => [...new Set(lista)]
  const listaEmpresas = unicos(empresas)
  const listaCasos = unicos(casos)
  for (const e of listaEmpresas.filter(ehPublicada)) {
    if (!conhecido(e.nome)) item(R.semNome, `content (${e.slug})`, `Empresa ${e.codigo} publicada sem nome.`)
    if (typeof e.descricao === 'string' && e.descricao.length > 160)
      item(R.coerencia, `content (${e.slug})`, `Descrição de ${e.codigo} com ${e.descricao.length} caracteres (máximo 160).`)
    if (Array.isArray(e.numeros) && e.numeros.length > 3)
      item(R.coerencia, `content (${e.slug})`, `${e.codigo} tem ${e.numeros.length} números (máximo 3).`)
  }
  for (const c of listaCasos.filter(ehPublicada)) {
    if (!conhecido(c.titulo)) item(R.semNome, `content (${c.slug})`, `Case Nº ${c.numero} publicado sem título.`)
    if (typeof c.tese === 'string' && c.tese.length > 160)
      item(R.coerencia, `content (${c.slug})`, `Tese do case Nº ${c.numero} com ${c.tese.length} caracteres (máximo 160).`)
  }

  /* espaços reservados em produção: o mapa completa até 3; /cases/ completa até 3 linhas (spec §7.4, §12.4) */
  const situacao = { empresas: null, casos: null }
  if (listaEmpresas.length) {
    const publicadas = listaEmpresas.filter(ehPublicada).length
    const reservados = Math.max(0, 3 - publicadas)
    situacao.empresas = { total: listaEmpresas.length, publicadas, placeholders: listaEmpresas.filter(e => e.placeholder).length, reservados }
    if (reservados > 3) item(R.reservados, 'Home e /empresas/', `${reservados} espaços reservados.`)
  }
  if (listaCasos.length) {
    const publicados = listaCasos.filter(ehPublicada)
    const placeholders = listaCasos.filter(c => c.placeholder).length
    const reservados = Math.min(placeholders, Math.max(0, 3 - publicados.length))
    situacao.casos = { total: listaCasos.length, publicados: publicados.map(c => c.numero), placeholders, reservados }
    if (reservados > 3) item(R.reservados, '/cases/', `${reservados} espaços reservados.`)
  }

  /* privacidade */
  if (privacidade) {
    const { obj, arquivo } = privacidade
    const lido = lidos.get(arquivo)
    const pos = lido ? lido.mascara.search(/\bpublicada\s*:/) : -1
    const onde = pos >= 0 ? `${arquivo}:${lido.linhaDe(pos)}` : arquivo
    if (obj.publicada !== true) item(R.privacidade, onde, 'A página não está publicada: privacidade.publicada é false.')
    for (const [chave, v] of Object.entries(obj)) {
      if (!ehPendente(v)) continue
      const o = avaliacao.registro.origem.get(v)
      item(R.privacidade, o ? `${o.arquivo}:${o.linha}` : arquivo, `privacidade.${chave}: ${v.hint}`)
    }
  }

  /* reserva estática: arquivos de content/ que não puderam ser executados */
  for (const arquivo of deConteudo.filter(f => !executados.has(f))) {
    const lido = lidos.get(arquivo)
    for (const o of objetosLiterais(lido)) {
      const p = o.props
      const onde = `${arquivo}:${lido.linhaDe(o.ini)}`
      if (valorLiteral(p.placeholder) === true && valorLiteral(p.publicar) === true)
        item(R.placeholder, onde, 'placeholder: true com publicar: true.')
      if (p.valor && p.fonte && p.periodo && p.verificadoEm && !/^(pending\s*\(|undefined$|null$)/.test(p.valor.bruto)) {
        const vazio = k => /^pending\s*\(/.test(p[k].bruto) || /^(['"`])\s*\1$/.test(p[k].bruto)
        const faltam = ['fonte', 'periodo', 'verificadoEm', ...(p.metodo ? ['metodo'] : [])].filter(vazio)
        if (faltam.length) item(R.medida, onde, `medida com valor, mas falta ${juntar(faltam.map(nomeDoCampo))}.`)
      }
      if (p.publicada && !privacidade && /privacidade\s*:\s*$/.test(lido.mascara.slice(Math.max(0, o.ini - 40), o.ini)) && valorLiteral(p.publicada) !== true)
        item(R.privacidade, onde, 'A página não está publicada: privacidade.publicada não é true.')
    }
  }

  /* pendências: execução primeiro; leitura estática para o que a execução não alcança */
  const pendencias = new Map()
  const anotar = (arquivo, entrada) => {
    if (!pendencias.has(arquivo)) pendencias.set(arquivo, [])
    pendencias.get(arquivo).push(entrada)
  }
  const reg = avaliacao.registro ?? { pendentes: [], validacoes: [] }
  const linhasExecutadas = new Map()
  for (const p of reg.pendentes) {
    if (!p.arquivo) continue
    anotar(p.arquivo, { tipo: 'PENDENTE', linha: p.linha, texto: p.hint })
    executados.add(p.arquivo)
  }
  for (const v of reg.validacoes) {
    if (!v.arquivo) continue
    anotar(v.arquivo, { tipo: 'VALIDAR', linha: v.linha, texto: v.texto, aprovado: v.aprovado })
    if (!linhasExecutadas.has(v.arquivo)) linhasExecutadas.set(v.arquivo, new Set())
    linhasExecutadas.get(v.arquivo).add(v.linha)
  }
  // só conta a chamada da lib (importada de lib/conteudo ou lib/pending) ou com texto literal: um componente
  // pode ter uma função local chamada `validar` (validação de formulário, por exemplo)
  const importa = (src, nome, modulo) => new RegExp(`import\\s*\\{[^}]*\\b${nome}\\b[^}]*\\}\\s*from\\s*['"][^'"]*lib/${modulo}['"]`).test(src)
  for (const [arquivo, lido] of lidos) {
    const daLib = { validar: importa(lido.src, 'validar', 'conteudo'), pending: importa(lido.src, 'pending', 'pending') }
    for (const ch of lido.chamadas) {
      if (!ch.bruto && ch.valor === null) continue
      if (!daLib[ch.nome] && ch.valor === null) continue
      const linha = lido.linhaDe(ch.ini)
      const texto = ch.valor ?? `(expressão: ${ch.bruto})`
      if (ch.nome === 'pending' && !executados.has(arquivo)) anotar(arquivo, { tipo: 'PENDENTE', linha, texto })
      if (ch.nome === 'validar' && !linhasExecutadas.get(arquivo)?.has(linha)) {
        const aprovado = ch.segundo === 'true' ? true : ch.segundo && ch.segundo !== 'false' ? null : false
        anotar(arquivo, { tipo: 'VALIDAR', linha, texto, aprovado })
      }
    }
  }
  const PASTAS = ['content', 'components', 'app', 'lib', 'hooks']
  const pasta = a => (PASTAS.indexOf(a.split('/')[0]) + PASTAS.length + 1) % (PASTAS.length + 1)
  const ordemDeArquivo = (a, b) => pasta(a) - pasta(b) || a.split('/').length - b.split('/').length || a.localeCompare(b)
  for (const arquivo of [...pendencias.keys()].sort(ordemDeArquivo)) {
    const entradas = pendencias.get(arquivo)
    pendencias.delete(arquivo)
    const agrupadas = new Map()
    for (const e of entradas) {
      const chave = `${e.tipo}|${e.linha}|${e.texto}|${e.aprovado}`
      if (agrupadas.has(chave)) agrupadas.get(chave).vezes++
      else agrupadas.set(chave, { ...e, vezes: 1 })
    }
    pendencias.set(
      arquivo,
      [...agrupadas.values()].sort((a, b) => a.linha - b.linha || a.texto.localeCompare(b.texto, 'pt-BR', { numeric: true })),
    )
  }
  for (const [arquivo, entradas] of pendencias)
    for (const e of entradas)
      if (e.tipo === 'VALIDAR' && e.aprovado !== true)
        item(R.validar, `${arquivo}:${e.linha}`, e.aprovado === null ? `${e.texto} (aprovação por expressão; confira)` : e.texto)

  return { producao, envLidos, regras, pendencias, situacao, avaliacao, arquivosLidos: fontes.length + folhas.length }
}

const NOMES_DE_CAMPO = { fonte: 'fonte', periodo: 'período', verificadoEm: 'data de verificação (verificadoEm)', metodo: 'método' }
const nomeDoCampo = k => NOMES_DE_CAMPO[k] ?? k
function juntar(itens) {
  return itens.length <= 1 ? (itens[0] ?? '') : `${itens.slice(0, -1).join(', ')} e ${itens.at(-1)}`
}

function linhasIgnoradas(lido) {
  const linhas = new Set()
  for (const c of lido.comentarios) {
    if (!/check-content:\s*ignorar/i.test(c.texto)) continue
    linhas.add(lido.linhaDe(c.ini))
    linhas.add(lido.linhaDe(c.fim) + 1)
  }
  return linhas
}
function trecho(valor, ini, fim) {
  const a = Math.max(0, ini - 24)
  const b = Math.min(valor.length, fim + 24)
  const meio = valor
    .slice(a, b)
    .replace(RE_PROIBIDOS, ch => `[${PROIBIDOS.get(ch)[0]}]`)
    .replace(/[\t\n\r ]+/g, ' ')
  return `${a > 0 ? '…' : ''}${meio}${b < valor.length ? '…' : ''}`
}
function conferirTextos(arquivo, lido, R, item) {
  const ignoradas = linhasIgnoradas(lido)
  for (const t of lido.textos) {
    if (t.importacao) continue
    let desde = t.ini
    for (const m of t.valor.matchAll(RE_PROIBIDOS)) {
      const bruto = lido.src.indexOf(m[0], desde)
      const pos = bruto >= t.ini && bruto < t.fim ? bruto : t.ini
      if (bruto >= t.ini && bruto < t.fim) desde = bruto + 1
      const [codigo, nome, troca] = PROIBIDOS.get(m[0])
      item(R.caracteres, `${arquivo}:${lido.linhaDe(pos)}:${lido.colunaDe(pos)}`, `${codigo} (${nome}) em "${trecho(t.valor, m.index, m.index + 1)}": ${troca}.`)
    }
    const linha = lido.linhaDe(t.ini)
    if (ignoradas.has(linha)) continue
    for (const [termo, re] of VETADAS) {
      for (const m of t.valor.matchAll(re)) {
        const bruto = lido.src.indexOf(m[0], t.ini)
        const pos = bruto >= t.ini && bruto < t.fim ? bruto : t.ini
        if (ignoradas.has(lido.linhaDe(pos))) continue
        item(R.vetadas, `${arquivo}:${lido.linhaDe(pos)}`, `${termo}: "${trecho(t.valor, m.index, m.index + m[0].length)}"`)
      }
    }
    for (const m of t.valor.matchAll(RE_UNIDADE))
      item(R.unidade, `${arquivo}:${linha}`, `"${trecho(t.valor, m.index, m.index + m[0].length)}"`)
  }
}
function conferirCss(arquivo, src, R, item) {
  const semComentarios = src.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '))
  const linhaDe = pos => src.slice(0, pos).split('\n').length
  for (const m of semComentarios.matchAll(/(["'])((?:\\[\s\S]|(?!\1)[^\\\n])*)\1/g)) {
    const valor = m[2].replace(/\\([0-9a-f]{1,6})\s?/gi, (_, h) => codigoParaTexto(parseInt(h, 16)))
    for (const p of valor.matchAll(RE_PROIBIDOS)) {
      const [codigo, nome, troca] = PROIBIDOS.get(p[0])
      item(R.caracteres, `${arquivo}:${linhaDe(m.index)}`, `${codigo} (${nome}) numa string de CSS: ${troca}.`)
    }
  }
}

/* ── relatórios ────────────────────────────────────────────────────────────── */

function nivelDe(regra, producao) {
  return producao ? regra.producao : regra.homologacao
}
function contarPendencias(pendencias) {
  let pendentes = 0
  let validar = 0
  let arquivos = 0
  for (const entradas of pendencias.values()) {
    const abertas = entradas.filter(e => e.tipo === 'PENDENTE' || e.aprovado !== true)
    pendentes += abertas.filter(e => e.tipo === 'PENDENTE').length
    validar += abertas.filter(e => e.tipo === 'VALIDAR').length
    if (abertas.length) arquivos++
  }
  return { pendentes, validar, arquivos }
}
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`

/** Itens de uma regra agrupados por arquivo, para o terminal. */
function imprimirItens(regra, recuo) {
  const porArquivo = new Map()
  for (const it of regra.itens) {
    const [arquivo, ...resto] = it.onde.split(':')
    const chave = resto.length ? arquivo : it.onde
    if (!porArquivo.has(chave)) porArquivo.set(chave, [])
    porArquivo.get(chave).push({ linha: resto.join(':'), texto: it.texto })
  }
  for (const [arquivo, itens] of porArquivo) {
    const soAmbiente = arquivo === 'ambiente'
    if (!soAmbiente) console.log(`${recuo}${apagado(arquivo)}`)
    const comLinha = itens.some(it => it.linha)
    for (const it of itens) {
      const prefixo = soAmbiente ? recuo : `${recuo}  ${comLinha ? apagado(it.linha.padStart(4)) + '  ' : ''}`
      console.log(`${prefixo}${it.texto}`)
    }
  }
}

function relatorio(resultado) {
  const { producao, regras, pendencias, avaliacao, arquivosLidos, envLidos } = resultado
  const falhas = regras.filter(r => r.itens.length && nivelDe(r, producao) === 'falha')
  const avisos = regras.filter(r => r.itens.length && nivelDe(r, producao) === 'aviso')
  const bloqueariam = producao ? [] : regras.filter(r => r.itens.length && r.producao === 'falha' && r.homologacao !== 'falha')
  const cont = contarPendencias(pendencias)
  const modo = producao ? 'produção (NEXT_PUBLIC_SITE_ENV=production)' : 'homologação'
  const leitura = avaliacao.disponivel ? 'conteúdo executado com type stripping' : 'só leitura estática'
  console.log(`${negrito('check-content')} · ${modo}`)
  console.log(apagado(`${plural(arquivosLidos, 'arquivo lido', 'arquivos lidos')} · ${leitura}${envLidos.length ? ` · ${envLidos.join(', ')}` : ''}`))
  console.log('')

  if (falhas.length) {
    console.log(vermelho(negrito(producao ? `A publicação está bloqueada. Resolva ${plural(falhas.length, 'item', 'itens')}:` : `${plural(falhas.length, 'falha', 'falhas')}:`)))
    console.log('')
    falhas.forEach((r, k) => {
      console.log(negrito(`${k + 1}. ${r.titulo}${r.itens.length > 1 ? ` (${r.itens.length})` : ''}`))
      imprimirItens(r, '   ')
      for (const linha of r.ajuda) console.log(apagado(`   ${linha}`))
      console.log('')
    })
  } else console.log(verde('Nenhuma falha.'))

  if (avisos.length) {
    if (!falhas.length) console.log('')
    console.log(amarelo(negrito(`Avisos (${avisos.reduce((s, r) => s + r.itens.length, 0)})`)))
    for (const r of avisos) {
      console.log(`  ${r.titulo}`)
      imprimirItens(r, '    ')
    }
    console.log('')
  } else if (!falhas.length) console.log('')

  if (bloqueariam.length) {
    const nomes = bloqueariam.map(r => (r.id === 'validar' ? `${cont.validar} [VALIDAR] sem aprovação` : r.titulo.toLowerCase()))
    console.log(`Bloqueariam o build de produção: ${nomes.join(' · ')}.`)
  }
  console.log(
    apagado(
      `Pendências: ${plural(cont.pendentes, 'dado [PENDENTE]', 'dados [PENDENTE]')} · ${plural(cont.validar, 'compromisso [VALIDAR]', 'compromissos [VALIDAR]')} em ${plural(cont.arquivos, 'arquivo', 'arquivos')}. Checklist completo: npm run pendencias`,
    ),
  )
  if (falhas.length) {
    console.log('')
    console.log(vermelho(`check-content: ${plural(falhas.length, 'bloqueio', 'bloqueios')}. Build interrompido.`))
  }
  return falhas.length ? 1 : 0
}

/** Checklist em Markdown (npm run pendencias), para a Gois Group preencher e aprovar. */
function checklist(resultado) {
  const { producao, regras, pendencias, situacao } = resultado
  const cont = contarPendencias(pendencias)
  const data = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date())
  const saida = []
  const p = s => saida.push(s)
  p('# Pendências do site da Gois Group')
  p('')
  p(`Gerado por \`npm run pendencias\` em ${data} · modo ${producao ? 'produção' : 'homologação'}.`)
  p(`${plural(cont.pendentes, 'dado [PENDENTE]', 'dados [PENDENTE]')} · ${plural(cont.validar, 'compromisso [VALIDAR]', 'compromissos [VALIDAR]')} · ${plural(cont.arquivos, 'arquivo', 'arquivos')}.`)
  p('')
  p("- **[PENDENTE]** — dado factual que só a Gois Group pode fornecer. Troque `pending('[…]')` pelo valor real.")
  p("- **[VALIDAR]** — compromisso ou oferta que a Gois Group precisa confirmar que pratica. Para aprovar: `validar('…', true)`.")
  p('')

  const bloqueios = regras.filter(r => r.itens.length && r.producao === 'falha')
  p('## Antes de publicar')
  p('')
  if (!bloqueios.length) p('Nada bloqueia o build de produção.')
  for (const r of bloqueios) {
    if (r.id === 'validar') {
      p(`- [ ] **${r.titulo}** — ${plural(r.itens.length, 'frase', 'frases')}, listadas por arquivo abaixo.`)
      continue
    }
    p(`- [ ] **${r.titulo}**`)
    for (const it of r.itens) p(`  - ${it.onde === 'ambiente' ? '' : `\`${it.onde}\` — `}${it.texto}`)
    p(`  - ${r.ajuda.join(' ')}`)
  }
  p('')

  if (situacao.empresas || situacao.casos) {
    p('## Situação do conteúdo')
    p('')
    if (situacao.empresas) {
      const e = situacao.empresas
      p(`- Empresas publicadas: ${e.publicadas} · placeholders: ${e.placeholders} · espaços reservados em produção (Home e /empresas/): ${e.reservados}.`)
    }
    if (situacao.casos) {
      const c = situacao.casos
      const nums = c.publicados.map(n => `Nº ${n}`).join(', ') || 'nenhum'
      p(`- Cases publicados: ${nums} · placeholders: ${c.placeholders} · espaços reservados em produção (/cases/): ${c.reservados}.`)
    }
    p('')
  }

  p('## Por arquivo')
  for (const arquivo of pendencias.keys()) {
    const entradas = pendencias.get(arquivo).filter(e => e.tipo === 'PENDENTE' || e.aprovado !== true)
    if (!entradas.length) continue
    const np = entradas.filter(e => e.tipo === 'PENDENTE').length
    const nv = entradas.length - np
    const partes = [np && plural(np, '[PENDENTE]', '[PENDENTE]'), nv && plural(nv, '[VALIDAR]', '[VALIDAR]')].filter(Boolean)
    p('')
    p(`### ${arquivo} — ${partes.join(' · ')}`)
    p('')
    for (const e of entradas) {
      const vezes = e.vezes > 1 ? ` (×${e.vezes})` : ''
      const texto = e.tipo === 'PENDENTE' ? `\`${e.texto}\`` : `“${e.texto}”${e.aprovado === null ? ' (aprovação por expressão; confira)' : ''}`
      p(`- [ ] ${e.tipo === 'PENDENTE' ? '[PENDENTE]' : '[VALIDAR]'} ${texto}${vezes} — linha ${e.linha}`)
    }
  }

  const avisos = regras.filter(r => r.itens.length && r.producao !== 'falha')
  if (avisos.length) {
    p('')
    p('## Avisos')
    for (const r of avisos) {
      p('')
      p(`- **${r.titulo}**`)
      for (const it of r.itens) p(`  - ${it.onde === 'ambiente' ? '' : `\`${it.onde}\` — `}${it.texto}`)
    }
  }
  p('')
  console.log(saida.join('\n'))
  return 0
}

/* ── execução direta ───────────────────────────────────────────────────────── */

async function principal() {
  const args = process.argv.slice(2)
  if (args.includes('--ajuda') || args.includes('-h') || args.includes('--help')) {
    console.log('Uso: node scripts/check-content.mjs [--listar]')
    console.log('  sem opções   gates de conteúdo (prebuild); falha conforme NEXT_PUBLIC_SITE_ENV')
    console.log('  --listar     checklist em Markdown de todas as pendências [PENDENTE] e [VALIDAR], por arquivo')
    return 0
  }
  garantirTypeStripping()
  const resultado = await coletar()
  return args.includes('--listar') ? checklist(resultado) : relatorio(resultado)
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  principal().then(
    codigo => process.exit(codigo),
    erro => {
      console.error(vermelho(`check-content: erro interno — ${erro?.stack ?? erro}`))
      process.exit(2)
    },
  )
}
