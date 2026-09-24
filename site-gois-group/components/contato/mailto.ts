import { contato as t } from '@/content/copy/contato'
import { linhasPreenchidas, rotuloDeLinha, tituloDoTipo, type TipoProjeto, type Valores } from './campos'

/**
 * A mensagem montada a partir do formulário (spec §14.7 · Técnica). A mesma serve ao `mailto:` (sem
 * endpoint, ou quando o envio falha) e ao botão "Copiar mensagem".
 *
 * assunto: `[Gois Group] {Tipo} — {Empresa ou Nome}`
 * corpo:   `Rótulo: valor` por linha + `Origem: {origem}`
 */
export interface Mensagem {
  assunto: string
  corpo: string
}

export function montarMensagem(tipo: TipoProjeto, valores: Valores, origem: string): Mensagem {
  const empresa = typeof valores.empresa === 'string' ? valores.empresa.trim() : ''
  const nome = typeof valores.nome === 'string' ? valores.nome.trim() : ''
  const assunto = t.mensagem.assunto(tituloDoTipo(tipo), empresa || nome)
  const linhas = linhasPreenchidas(tipo, valores).map(l => `${rotuloDeLinha(l.rotulo)}: ${l.valor}`)
  linhas.push(`${t.mensagem.origem}: ${origem || t.mensagem.semOrigem}`)
  return { assunto, corpo: linhas.join('\n') }
}

/** Texto único para a área de transferência: assunto, linha em branco, corpo. */
export function mensagemComoTexto(m: Mensagem): string {
  return `${m.assunto}\n\n${m.corpo}`
}

/** RFC 6068: espaço como %20 e quebra de linha como %0D%0A. */
export function mailtoHref(email: string, m: Mensagem): string {
  const cod = (s: string) => encodeURIComponent(s.replace(/\r?\n/g, '\r\n'))
  return `mailto:${email}?subject=${cod(m.assunto)}&body=${cod(m.corpo)}`
}
