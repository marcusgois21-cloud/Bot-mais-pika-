import { isPending, type Maybe } from './pending'
import { SHOW_PENDING } from './env'

/**
 * Frase de compromisso ou de oferta que a Gois Group precisa confirmar que pratica (spec §0, [VALIDAR]).
 * Aparece no site normalmente; o build de produção falha enquanto `aprovado` for false.
 */
export type Validar = { readonly __validar: true; readonly texto: string; readonly aprovado: boolean }
export const validar = (texto: string, aprovado = false): Validar => ({ __validar: true, texto, aprovado })
export type Texto = string | Validar

export function isValidar(v: unknown): v is Validar {
  return typeof v === 'object' && v !== null && (v as Validar).__validar === true
}
export function texto(v: Texto): string {
  return isValidar(v) ? v.texto : v
}

export type Status = 'em-operacao' | 'em-construcao' | 'em-evolucao'
export type Relacao = 'estrutura-construida' | 'estrutura-operada' | 'empresa-do-grupo' | 'parceira'
export type Escopo = 'site' | 'plataforma' | 'sistema' | 'produto' | 'reconstrucao'

export const STATUS_ROTULO: Record<Status, string> = {
  'em-operacao': 'Em operação',
  'em-construcao': 'Em construção',
  'em-evolucao': 'Em evolução',
}
export const RELACAO_ROTULO: Record<Relacao, string> = {
  'estrutura-construida': 'Estrutura construída',
  'estrutura-operada': 'Estrutura operada',
  'empresa-do-grupo': 'Empresa do grupo',
  parceira: 'Parceira',
}
export const ESCOPO_ROTULO: Record<Escopo, string> = {
  site: 'Site',
  plataforma: 'Plataforma',
  sistema: 'Sistema interno',
  produto: 'Produto digital',
  reconstrucao: 'Reconstrução',
}

export interface Medida {
  id: string
  rotulo: string
  definicao: string
  unidade?: string
  calculo: 'manual' | 'derivado'
  valor: Maybe<number>
  fonte: Maybe<string>
  periodo: Maybe<string>
  /** AAAA-MM */
  verificadoEm: Maybe<string>
}

export interface Empresa {
  slug: string
  codigo: `E-${string}`
  /** slot do mapa do ecossistema (spec §9.2) */
  ordem: number
  placeholder: boolean
  publicar: boolean
  nome: Maybe<string>
  /** logo só se fornecido pela empresa (SVG monocromático) */
  logoSvg?: string
  logoAlt?: string
  segmento: Maybe<string>
  /** ≤ 160 caracteres */
  descricao: Maybe<string>
  status: Maybe<Status>
  relacao: Maybe<Relacao>
  /** mês/ano */
  desde: Maybe<string>
  website: Maybe<string>
  escopo: Maybe<{ item: Escopo; texto: string }[]>
  /** ≤ 3 */
  numeros: Medida[]
  caseSlug?: string
}

export type Capitulo = 'problema' | 'oportunidade' | 'estrategia' | 'construcao' | 'passouAExistir' | 'resultado'

export interface MetricaCase extends Medida {
  antes: Maybe<number>
  depois: Maybe<number>
  metodo: Maybe<string>
}

export interface Case {
  /** '000', '001'… */
  numero: string
  slug: string
  placeholder: boolean
  publicar: boolean
  titulo: Maybe<string>
  tese: Maybe<string>
  empresaSlug?: string
  estrutura: Maybe<Escopo[]>
  periodo: Maybe<{ inicio: Maybe<string>; lancamento?: string }>
  status: Maybe<Status>
  website: Maybe<string>
  capitulos: Record<Capitulo, Maybe<string>>
  stack?: { tecnologia: string; paraQue: string }[]
  metricas: MetricaCase[]
  /** só o Nº 000: métricas geradas por scripts/measure-build.mjs */
  metricasDoBuild?: true
}

/** Uma entidade aparece publicamente quando é real e autorizada; em homologação, placeholders também. */
export function visivel(e: { placeholder: boolean; publicar: boolean }): boolean {
  return (e.publicar && !e.placeholder) || (SHOW_PENDING && e.placeholder)
}
export function publicada(e: { placeholder: boolean; publicar: boolean }): boolean {
  return e.publicar && !e.placeholder
}

export { isPending }
export type { Maybe }
