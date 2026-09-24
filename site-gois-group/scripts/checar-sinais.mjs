#!/usr/bin/env node
/**
 * Confere, antes do deploy de produção, se o site de cada empresa publicada com status "em operação"
 * responde (spec §9.7). É o que sustenta o marcador "Em operação" no ecossistema: o status não é só
 * declarado, é conferido a cada publicação.
 *
 *   node scripts/checar-sinais.mjs
 *
 * - HEAD em `website`, com tempo máximo de 8 s e sem seguir redirecionamento: 2xx ou 3xx passa.
 *   Servidor que não aceita HEAD (405 ou 501) recebe um GET, que responde à mesma pergunta.
 * - Qualquer outra resposta, erro de rede ou tempo esgotado interrompe o deploy (código de saída 1),
 *   com a lista de falhas.
 * - PERMITIR_SINAL_FALHO=1 libera o deploy mesmo assim; o override fica registrado no log, com data,
 *   usuário e as falhas ignoradas.
 *
 * Lê content/empresas.ts com a mesma rotina do check-content (type stripping do Node); sem type
 * stripping, cai para a leitura estática dos objetos literais do arquivo. Sem dependências.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  RAIZ,
  avaliarConteudo,
  carregarEnv,
  ehPendente,
  ehPublicada,
  escanear,
  garantirTypeStripping,
  objetosLiterais,
  valorLiteral,
} from './check-content.mjs'

const ARQUIVO = 'content/empresas.ts'
const TEMPO_MAXIMO = 8000
const COR = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR
const pintar = codigo => s => (COR ? `\x1b[${codigo}m${s}\x1b[0m` : String(s))
const negrito = pintar('1')
const vermelho = pintar('31')
const amarelo = pintar('33')
const verde = pintar('32')
const apagado = pintar('2')

const ehEmpresa = e =>
  e !== null && typeof e === 'object' && typeof e.codigo === 'string' && e.codigo.startsWith('E-') && typeof e.publicar === 'boolean'

/** Empresas de content/empresas.ts: executando o módulo ou, sem type stripping, pela leitura estática. */
async function lerEmpresas() {
  const avaliacao = await avaliarConteudo([ARQUIVO])
  const mod = avaliacao.modulos.get(ARQUIVO)
  if (mod) {
    const todas = Object.values(mod).flatMap(v => (Array.isArray(v) ? v : [v])).filter(ehEmpresa)
    return { empresas: todas, leitura: 'execução' }
  }
  const motivo = avaliacao.erros.get(ARQUIVO) ?? avaliacao.motivo
  const lido = escanear(fs.readFileSync(path.join(RAIZ, ARQUIVO), 'utf8'))
  const empresas = objetosLiterais(lido)
    .map(o => Object.fromEntries(Object.entries(o.props).map(([k, v]) => [k, valorLiteral(v)])))
    .filter(ehEmpresa)
  // leitura aproximada: se o arquivo marca algo para publicar e nada foi reconhecido, não dá para afirmar que está tudo no ar
  const ilegivel = !empresas.some(e => e.publicar === true) && /\bpublicar\s*:\s*true\b/.test(lido.mascara)
  return { empresas, leitura: `leitura estática (${motivo})`, ilegivel }
}

function descreverErro(erro) {
  if (erro?.name === 'TimeoutError' || erro?.name === 'AbortError') return `sem resposta em ${TEMPO_MAXIMO / 1000} s`
  const causa = erro?.cause
  const codigo = causa?.code ?? erro?.code
  const conhecidos = {
    ENOTFOUND: 'domínio não encontrado no DNS',
    EAI_AGAIN: 'DNS indisponível no momento',
    ECONNREFUSED: 'conexão recusada',
    ECONNRESET: 'conexão interrompida',
    ETIMEDOUT: 'tempo de conexão esgotado',
    EHOSTUNREACH: 'servidor inalcançável',
    UND_ERR_CONNECT_TIMEOUT: 'tempo de conexão esgotado',
  }
  if (codigo && conhecidos[codigo]) return `${conhecidos[codigo]} (${codigo})`
  if (codigo && /CERT|TLS|SSL|SELF_SIGNED|UNABLE_TO_VERIFY/.test(codigo)) return `certificado TLS inválido (${codigo})`
  return codigo ? `erro de rede (${codigo})` : String(causa?.message ?? erro?.message ?? erro)
}

async function conferir(url) {
  const inicio = performance.now()
  const pedir = metodo =>
    fetch(url, {
      method: metodo,
      redirect: 'manual',
      signal: AbortSignal.timeout(TEMPO_MAXIMO),
      headers: { 'user-agent': 'checar-sinais (site da Gois Group; confere se o site está no ar)' },
    })
  try {
    let metodo = 'HEAD'
    let resposta = await pedir(metodo)
    if (resposta.status === 405 || resposta.status === 501) {
      metodo = 'GET'
      resposta = await pedir(metodo)
    }
    await resposta.body?.cancel().catch(() => {})
    const ms = Math.round(performance.now() - inicio)
    const ok = resposta.status >= 200 && resposta.status < 400
    const destino = resposta.headers.get('location')
    const detalhe = `${resposta.status} · ${metodo} · ${ms} ms${destino ? ` · redireciona para ${destino}` : ''}`
    return { ok, detalhe: ok ? detalhe : `respondeu ${detalhe}` }
  } catch (erro) {
    return { ok: false, detalhe: descreverErro(erro) }
  }
}

function usuario() {
  try {
    return process.env.GITHUB_ACTOR || process.env.USER || os.userInfo().username
  } catch {
    return 'desconhecido'
  }
}

async function principal() {
  garantirTypeStripping()
  carregarEnv()
  const { empresas, leitura, ilegivel } = await lerEmpresas()
  if (ilegivel) {
    console.log(vermelho(negrito('checar-sinais: não foi possível ler as empresas publicadas sem executar content/empresas.ts.')))
    console.log(`  ${leitura}. Rode com o Node 22.18 ou mais recente (type stripping).`)
    return 1
  }
  const emOperacao = empresas.filter(e => ehPublicada(e) && e.status === 'em-operacao')
  if (!emOperacao.length) {
    console.log(`${negrito('checar-sinais')}: nenhuma empresa publicada com status "em operação". Nada a conferir.`)
    console.log(apagado(`${ARQUIVO} · ${leitura}`))
    return 0
  }

  console.log(`${negrito('checar-sinais')} · ${emOperacao.length === 1 ? '1 empresa publicada' : `${emOperacao.length} empresas publicadas`} em operação`)
  console.log(apagado(`${ARQUIVO} · ${leitura} · HEAD com tempo máximo de ${TEMPO_MAXIMO / 1000} s`))
  const resultados = await Promise.all(
    emOperacao.map(async e => {
      const nome = typeof e.nome === 'string' ? e.nome : e.slug
      const site = typeof e.website === 'string' ? e.website.trim() : ''
      let url = null
      try {
        url = site && !ehPendente(e.website) ? new URL(site) : null
      } catch {}
      if (!url || !/^https?:$/.test(url.protocol))
        return { e, nome, site: site || '(sem website)', ok: false, detalhe: 'sem endereço http(s) válido em website' }
      return { e, nome, site: url.href, ...(await conferir(url.href)) }
    }),
  )
  for (const r of resultados) {
    const marca = r.ok ? verde('OK    ') : vermelho('FALHA ')
    console.log(`  ${marca} ${r.e.codigo}  ${r.nome}  ${apagado(r.site)}  ${r.detalhe}`)
  }

  const falhas = resultados.filter(r => !r.ok)
  if (!falhas.length) {
    console.log(verde(`checar-sinais: ${resultados.length === 1 ? 'o site respondeu' : `os ${resultados.length} sites responderam`}.`))
    return 0
  }
  const quais = falhas.map(r => `${r.e.codigo} ${r.nome}: ${r.detalhe}`).join('; ')
  if (process.env.PERMITIR_SINAL_FALHO === '1') {
    console.log(
      amarelo(
        `checar-sinais: OVERRIDE registrado · PERMITIR_SINAL_FALHO=1 · ${new Date().toISOString()} · usuário ${usuario()} · ` +
          `${falhas.length === 1 ? '1 falha ignorada' : `${falhas.length} falhas ignoradas`}: ${quais}.`,
      ),
    )
    console.log(apagado('O deploy segue. O status "Em operação" dessas empresas vai ao ar sem confirmação.'))
    return 0
  }
  console.log('')
  console.log(vermelho(negrito(`checar-sinais: ${falhas.length === 1 ? '1 falha' : `${falhas.length} falhas`}. Deploy interrompido.`)))
  console.log('  Confira o endereço (website) em content/empresas.ts ou, enquanto o site estiver fora do ar,')
  console.log('  mude o status da empresa para "em-construcao" ou "em-evolucao".')
  console.log('  Para publicar mesmo assim: PERMITIR_SINAL_FALHO=1 (o override fica registrado no log do deploy).')
  return 1
}

principal().then(
  codigo => process.exit(codigo),
  erro => {
    console.error(vermelho(`checar-sinais: erro interno — ${erro?.stack ?? erro}`))
    process.exit(2)
  },
)
