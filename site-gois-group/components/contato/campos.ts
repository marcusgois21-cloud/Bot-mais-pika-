import { contato as t, type TipoProjeto } from '@/content/copy/contato'
import type { Texto } from '@/lib/conteudo'

/**
 * Estrutura do formulário de /contato/ (spec §14.7): uma página, revelação progressiva por tipo.
 * "Sobre você" é comum a todos os tipos; "Sobre o projeto" muda com o tipo. Campos com o mesmo `id`
 * em tipos diferentes (o prazo) são o mesmo dado: trocar de tipo não apaga nada do que foi digitado.
 */

export type { TipoProjeto }
export type Valor = string | string[]
export type Valores = Record<string, Valor>

type Base = {
  /** chave no payload e no estado */
  readonly id: string
  readonly rotulo: string
  /** true, ou uma regra por tipo (a empresa é opcional em "parceria" e "outro") */
  readonly obrigatorio?: boolean | ((tipo: TipoProjeto | null) => boolean)
}
export type CampoTexto = Base & {
  readonly controle: 'text' | 'email' | 'tel' | 'url'
  readonly autocomplete?: string
  readonly ajuda?: string
  readonly placeholder?: string
  /** meia largura na grade de dois campos (≥ 600 px) */
  readonly meia?: boolean
}
export type CampoArea = Base & { readonly controle: 'textarea' }
export type CampoEscolha = Base & { readonly controle: 'radio' | 'checkbox'; readonly opcoes: readonly Texto[] }
export type CampoLista = Base & { readonly controle: 'select'; readonly opcoes: readonly string[] }
export type Campo = CampoTexto | CampoArea | CampoEscolha | CampoLista

export const ehEscolha = (c: Campo): c is CampoEscolha => c.controle === 'radio' || c.controle === 'checkbox'
export const ehTexto = (c: Campo): c is CampoTexto =>
  c.controle === 'text' || c.controle === 'email' || c.controle === 'tel' || c.controle === 'url'

export const TIPOS = t.tipo.opcoes.map(o => o.valor)
export function ehTipo(v: unknown): v is TipoProjeto {
  return typeof v === 'string' && (TIPOS as readonly string[]).includes(v)
}
export function tituloDoTipo(tipo: TipoProjeto): string {
  return t.tipo.opcoes.find(o => o.valor === tipo)?.titulo ?? tipo
}

const empresaObrigatoria = (tipo: TipoProjeto | null) => tipo !== 'outro' && tipo !== 'parceria'

export const SOBRE_VOCE: readonly CampoTexto[] = [
  { id: 'nome', controle: 'text', rotulo: t.sobreVoce.nome.rotulo, ajuda: t.sobreVoce.nome.ajuda, obrigatorio: true, autocomplete: 'name', meia: true },
  { id: 'email', controle: 'email', rotulo: t.sobreVoce.email.rotulo, obrigatorio: true, autocomplete: 'email', meia: true },
  { id: 'empresa', controle: 'text', rotulo: t.sobreVoce.empresa.rotulo, obrigatorio: empresaObrigatoria, autocomplete: 'organization', meia: true },
  { id: 'cargo', controle: 'text', rotulo: t.sobreVoce.cargo.rotulo, autocomplete: 'organization-title', meia: true },
  { id: 'telefone', controle: 'tel', rotulo: t.sobreVoce.telefone.rotulo, autocomplete: 'tel', meia: true },
]

const p = t.projeto
const prazo: CampoLista = { id: 'prazo', controle: 'select', rotulo: p.prazo.rotulo, opcoes: p.prazo.opcoes }

export const PROJETO: Record<TipoProjeto, readonly Campo[]> = {
  'site-novo': [
    { id: 'momento', controle: 'radio', rotulo: p.siteNovo.momento.rotulo, opcoes: p.siteNovo.momento.opcoes, obrigatorio: true },
    prazo,
    { id: 'objetivo', controle: 'textarea', rotulo: p.siteNovo.objetivo.rotulo, obrigatorio: true },
  ],
  'site-existente': [
    { id: 'siteAtual', controle: 'url', rotulo: p.siteExistente.endereco.rotulo, obrigatorio: true, autocomplete: 'url', placeholder: p.exemploUrl },
    { id: 'problemas', controle: 'checkbox', rotulo: p.siteExistente.problemas.rotulo, opcoes: p.siteExistente.problemas.opcoes },
    prazo,
    { id: 'mudancas', controle: 'textarea', rotulo: p.siteExistente.mudancas.rotulo },
  ],
  'plataforma-sistema': [
    { id: 'necessidades', controle: 'checkbox', rotulo: p.plataforma.necessidades.rotulo, opcoes: p.plataforma.necessidades.opcoes },
    { id: 'sistemas', controle: 'text', rotulo: p.plataforma.sistemas.rotulo },
    prazo,
    { id: 'usuarios', controle: 'textarea', rotulo: p.plataforma.usuarios.rotulo, obrigatorio: true },
  ],
  parceria: [
    { id: 'tipoParceria', controle: 'radio', rotulo: p.parceria.tipoParceria.rotulo, opcoes: p.parceria.tipoParceria.opcoes, obrigatorio: true },
    { id: 'siteParceiro', controle: 'url', rotulo: p.parceria.site.rotulo, autocomplete: 'url', placeholder: p.exemploUrl },
    { id: 'construirJunto', controle: 'textarea', rotulo: p.parceria.construirJunto.rotulo, obrigatorio: true },
  ],
  outro: [
    { id: 'assunto', controle: 'text', rotulo: p.outro.assunto.rotulo, obrigatorio: true },
    { id: 'mensagem', controle: 'textarea', rotulo: p.outro.mensagem.rotulo, obrigatorio: true },
  ],
}

/** Os campos que valem para o tipo escolhido, na ordem da página. */
export function camposAtivos(tipo: TipoProjeto | null): readonly Campo[] {
  return tipo ? [...SOBRE_VOCE, ...PROJETO[tipo]] : SOBRE_VOCE
}

export function ehObrigatorio(c: Campo, tipo: TipoProjeto | null): boolean {
  return typeof c.obrigatorio === 'function' ? c.obrigatorio(tipo) : Boolean(c.obrigatorio)
}

/** Valor inicial: o select começa na primeira opção ("Sem data definida"), o resto vazio. */
export function valorInicial(c: Campo): Valor {
  if (c.controle === 'checkbox') return []
  if (c.controle === 'select') return c.opcoes[0]
  return ''
}

/* ── validação ──────────────────────────────────────────────────────────────── */

const MINIMO_MENSAGEM = 20
const EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[^\s@.]{2,}$/

/** Aceita o endereço sem https:// e normaliza (spec §14.7). */
export function normalizarUrl(v: string): string {
  const s = v.trim()
  if (!s) return ''
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(s) ? s : `https://${s.replace(/^\/+/, '')}`
}
function urlValida(v: string): boolean {
  try {
    const u = new URL(normalizarUrl(v))
    return (u.protocol === 'https:' || u.protocol === 'http:') && /^[^.\s]+(\.[^.\s]+)*\.[a-z]{2,}$/i.test(u.hostname)
  } catch {
    return false
  }
}

/** Mensagem de erro do campo, ou null. Opcional vazio é sempre válido. */
export function validarCampo(c: Campo, valor: Valor | undefined, tipo: TipoProjeto | null): string | null {
  const obrigatorio = ehObrigatorio(c, tipo)
  if (Array.isArray(valor)) return null // checkboxes: sempre opcionais nesta spec
  const v = (valor ?? '').trim()

  if (c.controle === 'radio') return obrigatorio && !v ? t.erros.radio : null
  if (c.controle === 'select') return null

  if (!v) {
    if (!obrigatorio) return null
    if (c.controle === 'textarea') return t.erros.mensagem
    if (c.controle === 'email') return t.erros.emailVazio
    if (c.controle === 'url') return t.erros.urlVazia
    if (c.id === 'nome') return t.erros.nome
    if (c.id === 'empresa') return t.erros.empresa
    return t.erros.assunto
  }
  if (c.controle === 'email' && !EMAIL.test(v)) return t.erros.email
  if (c.controle === 'url' && !urlValida(v)) return t.erros.url
  if (c.controle === 'textarea' && obrigatorio && v.length < MINIMO_MENSAGEM) return t.erros.mensagem
  return null
}

export type Erros = Record<string, string>

/** Todos os erros do formulário, na ordem da página (o tipo primeiro). */
export function validarTudo(tipo: TipoProjeto | null, valores: Valores): Erros {
  const erros: Erros = {}
  if (!tipo) erros.tipo = t.erros.tipo
  for (const c of camposAtivos(tipo)) {
    const e = validarCampo(c, valores[c.id], tipo)
    if (e) erros[c.id] = e
  }
  return erros
}

/* ── o que foi preenchido, em ordem (resumo, payload, e-mail) ───────────────── */

export type Linha = { id: string; rotulo: string; valor: string }

/** "Em que momento a empresa está?" vira "Em que momento a empresa está" antes dos dois-pontos. */
export function rotuloDeLinha(rotulo: string): string {
  return rotulo.replace(/\?$/, '')
}

export function linhasPreenchidas(tipo: TipoProjeto, valores: Valores): Linha[] {
  const linhas: Linha[] = [{ id: 'tipo', rotulo: t.tipo.legenda, valor: tituloDoTipo(tipo) }]
  for (const c of camposAtivos(tipo)) {
    const v = valores[c.id]
    const texto = Array.isArray(v) ? v.join(', ') : c.controle === 'url' ? normalizarUrl(v ?? '') : (v ?? '').trim()
    if (texto) linhas.push({ id: c.id, rotulo: c.rotulo, valor: texto })
  }
  return linhas
}

/** Só os campos do tipo escolhido vão no envio; o resto fica guardado no estado, caso a pessoa volte. */
export function camposDoEnvio(tipo: TipoProjeto, valores: Valores): Record<string, Valor> {
  const saida: Record<string, Valor> = {}
  for (const c of camposAtivos(tipo)) {
    const v = valores[c.id]
    if (Array.isArray(v)) {
      if (v.length) saida[c.id] = v
    } else if (v && v.trim()) {
      saida[c.id] = c.controle === 'url' ? normalizarUrl(v) : v.trim()
    }
  }
  return saida
}

/** `?origem=`: só um código curto (letras, números, hífen, sublinhado). */
export function limparOrigem(v: string | null): string {
  if (!v) return ''
  const s = v.trim().toLowerCase().slice(0, 48)
  return /^[a-z0-9][a-z0-9_-]*$/.test(s) ? s : ''
}
