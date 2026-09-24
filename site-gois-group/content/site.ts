import { CONTACT_EMAIL } from '@/lib/env'
import { pending, type Maybe } from '@/lib/pending'

/**
 * Dados institucionais da Gois Group.
 * Tudo o que é `pending('[…]')` é dado factual que só a Gois Group pode fornecer — substitua pelo valor real.
 * O e-mail de contato vem de NEXT_PUBLIC_CONTACT_EMAIL.
 */
export const site = {
  nome: 'Gois Group',
  tagline: 'A estrutura por trás do que aparece.',
  headline: 'Construímos sites de dentro para fora.',
  fechamento: ['A superfície muda.', 'A estrutura fica.'] as const,
  descricao:
    'A Gois Group projeta e desenvolve sites, plataformas e sistemas web para empresas, começando pela estrutura: arquitetura, código, dados e velocidade.',

  email: (CONTACT_EMAIL || pending('[E-MAIL — a informar]')) as Maybe<string>,
  redes: pending('[REDES — perfis oficiais a informar]') as Maybe<{ rede: string; url: string }[]>,
  razaoSocial: pending('[RAZÃO SOCIAL — a informar]') as Maybe<string>,
  cnpj: pending('[CNPJ — a informar]') as Maybe<string>,
  fundacao: pending('[FUNDAÇÃO — ano a informar]') as Maybe<string>,
  fundadores: pending('[FUNDADORES — nomes a informar]') as Maybe<string[]>,
  marcos: pending('[MARCOS — a informar]') as Maybe<{ ano: string; marco: string }[]>,
  prazoResposta: pending('[PRAZO DE RESPOSTA — a informar]') as Maybe<string>,
  /** Início do projeto deste site (Case Nº 000). */
  inicioDoSite: pending('[PENDENTE: início do projeto]') as Maybe<string>,

  privacidade: {
    /** A página /privacidade/ só é indexada e listada no sitemap quando o texto jurídico estiver publicado. */
    publicada: false,
    controlador: pending('[RAZÃO SOCIAL — a informar]') as Maybe<string>,
    retencao: pending('[RETENÇÃO — por quanto tempo os dados ficam guardados, a informar]') as Maybe<string>,
    compartilhamento: pending('[PROVEDOR DO ENDPOINT — a informar]') as Maybe<string>,
    encarregado: pending('[ENCARREGADO — nome e canal a informar]') as Maybe<string>,
    textoJuridico: pending('[POLÍTICA DE PRIVACIDADE — texto jurídico a informar]') as Maybe<string>,
  },
}

export const NAV = [
  { href: '/empresas/', rotulo: 'Empresas' },
  { href: '/cases/', rotulo: 'Cases' },
  { href: '/sobre/', rotulo: 'Sobre' },
] as const

export const NAV_COMPLETA = [
  { href: '/', rotulo: 'Início' },
  ...NAV,
  { href: '/contato/', rotulo: 'Contato' },
] as const
