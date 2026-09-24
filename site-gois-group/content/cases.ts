import { pending } from '@/lib/pending'
import type { Case } from '@/lib/conteudo'
import { site } from './site'

/**
 * Cases (spec §12, §14.5). O Nº 000 é real: o próprio site, com métricas geradas a cada build
 * por scripts/measure-build.mjs. Os demais são PLACEHOLDERS até a Gois Group informar cases reais,
 * com autorização e métricas com fonte e período.
 */
export const casos: Case[] = [
  {
    numero: '000',
    slug: 'este-site',
    placeholder: false,
    publicar: true,
    titulo: 'Este site.',
    tese: 'Como apresentar uma empresa de desenvolvimento de sites sem pedir que ninguém acredite em nada que não possa conferir.',
    estrutura: ['site'],
    periodo: { inicio: site.inicioDoSite },
    status: 'em-construcao',
    website: '/',
    capitulos: {
      problema:
        'Apresentar uma empresa de desenvolvimento de sites sem cases, clientes ou números publicáveis — e sem pedir ao visitante que acredite em nada que ele não possa verificar.',
      oportunidade:
        'Para quem constrói sites, o próprio site é a única prova que qualquer pessoa pode inspecionar sozinha, agora.',
      estrategia:
        'Construir o site em duas camadas — a superfície e a estrutura — e deixar o visitante passar de uma para a outra. Publicar só dados verificáveis. Tratar o que ainda não é verificável como campo aberto, à vista. O que decidimos não fazer: 3D, vídeo de fundo, bibliotecas de animação, fotos de banco e números de exemplo.',
      construcao:
        'Next.js com exportação estática, React e TypeScript. CSS com tokens, sem framework. Nenhuma biblioteca de animação: o movimento é CSS, com poucas linhas de JavaScript onde o CSS não alcança. Fontes auto-hospedadas. O desenho do corte é gerado a partir das medidas reais da página, no navegador de quem visita.',
      passouAExistir:
        'Um site que se deixa ver por dentro: o corte no topo da página inicial, a vista “por dentro” em qualquer página, medições ao vivo e pendências declaradas.',
      resultado:
        'Medido, não declarado. Os números abaixo são gerados a cada versão publicada; os da sua visita estão na página inicial.',
    },
    stack: [
      { tecnologia: 'Next.js 16, exportação estática', paraQue: 'Páginas prontas no servidor, hospedáveis em qualquer lugar' },
      { tecnologia: 'React 19 + TypeScript', paraQue: 'Componentes e conteúdo tipado, com dado pendente impossível de publicar como real' },
      { tecnologia: 'CSS com tokens e CSS Modules', paraQue: 'Um sistema visual único, sem framework' },
      { tecnologia: 'Archivo e Martian Mono (Fontsource)', paraQue: 'Tipografia auto-hospedada' },
      { tecnologia: 'View Transitions API', paraQue: 'Transições entre páginas com fallback instantâneo' },
      { tecnologia: 'API de Performance do navegador', paraQue: 'As medições ao vivo da página inicial' },
    ],
    metricas: [],
    metricasDoBuild: true,
  },
  ...[1, 2].map(
    (n): Case => {
      const nnn = String(n).padStart(3, '0')
      const nn = String(n).padStart(2, '0')
      return {
        numero: nnn,
        slug: `case-${nn}`,
        placeholder: true,
        publicar: false,
        titulo: pending(`[CASE ${nn} — título a confirmar]`),
        tese: pending('[TESE — uma frase, até 160 caracteres, a confirmar]'),
        estrutura: pending('[ESTRUTURA — site, plataforma, sistema, produto ou reconstrução]'),
        periodo: pending('[PERÍODO — início e lançamento a confirmar]'),
        status: pending('[STATUS — em operação, em construção ou em evolução]'),
        website: pending('[SITE — URL a confirmar]'),
        capitulos: {
          problema: pending('[PROBLEMA — a escrever com a empresa]'),
          oportunidade: pending('[OPORTUNIDADE — a escrever com a empresa]'),
          estrategia: pending('[ESTRATÉGIA — a escrever com a empresa]'),
          construcao: pending('[CONSTRUÇÃO — a escrever com a empresa]'),
          passouAExistir: pending('[O QUE PASSOU A EXISTIR — a escrever com a empresa]'),
          resultado: pending('[RESULTADO — a escrever com a empresa]'),
        },
        metricas: [
          {
            id: `c${nn}-m1`,
            rotulo: '[MÉTRICA — rótulo a confirmar]',
            definicao: '[MÉTRICA — definição a confirmar]',
            calculo: 'manual',
            valor: pending('[MÉTRICA — antes, depois, período, fonte e método a confirmar]'),
            antes: pending('[ANTES — a confirmar]'),
            depois: pending('[DEPOIS — a confirmar]'),
            metodo: pending('[MÉTODO — a confirmar]'),
            fonte: pending('[FONTE — a confirmar]'),
            periodo: pending('[PERÍODO — a confirmar]'),
            verificadoEm: pending('[VERIFICADO EM — AAAA-MM]'),
          },
        ],
      }
    },
  ),
]

export const CAPITULOS = [
  { chave: 'problema', titulo: 'Problema', resumo: 'o que estava errado ou faltando.' },
  { chave: 'oportunidade', titulo: 'Oportunidade', resumo: 'o que ficava possível se fosse resolvido.' },
  { chave: 'estrategia', titulo: 'Estratégia', resumo: 'a tese e as escolhas, inclusive o que decidimos não fazer.' },
  { chave: 'construcao', titulo: 'Construção', resumo: 'o que foi feito, e com que tecnologia.' },
  { chave: 'passouAExistir', titulo: 'O que passou a existir', resumo: 'o site, a plataforma ou a empresa que foi ao ar.' },
  { chave: 'resultado', titulo: 'Resultado', resumo: 'o que mudou, em frases claras.' },
  { chave: 'metricas', titulo: 'Métricas', resumo: 'antes, depois, período, fonte e método de cada número.' },
] as const
