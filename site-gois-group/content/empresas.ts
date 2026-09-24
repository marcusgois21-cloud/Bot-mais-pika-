import { pending } from '@/lib/pending'
import type { Empresa } from '@/lib/conteudo'

/**
 * Empresas do ecossistema (spec §9, §21.2).
 * Hoje não há nenhuma empresa confirmada: os itens abaixo são PLACEHOLDERS (placeholder: true, publicar: false).
 * Em produção eles aparecem só como "Espaço reservado" (no máximo 3). Em homologação
 * (NEXT_PUBLIC_SHOW_PENDING=1) viram páginas-modelo com noindex.
 *
 * Para publicar uma empresa real: preencha os campos, `placeholder: false`, `publicar: true`
 * (somente com autorização da empresa e dados que possam ser conferidos).
 */
function placeholder(n: number): Empresa {
  const nn = String(n).padStart(2, '0')
  return {
    slug: `empresa-${nn}`,
    codigo: `E-${nn}`,
    ordem: n,
    placeholder: true,
    publicar: false,
    nome: pending(`[EMPRESA ${nn} — nome a confirmar]`),
    segmento: pending('[SEGMENTO — a confirmar]'),
    descricao: pending('[DESCRIÇÃO — até 160 caracteres, a confirmar]'),
    status: pending('[STATUS — em operação, em construção ou em evolução]'),
    relacao: pending('[RELAÇÃO — estrutura construída, estrutura operada, empresa do grupo ou parceira]'),
    desde: pending('[DESDE — mês/ano a confirmar]'),
    website: pending('[SITE — URL a confirmar]'),
    escopo: pending('[ESCOPO — o que a Gois Group construiu]'),
    numeros: [
      {
        id: `${nn}-n1`,
        rotulo: '[NÚMERO — rótulo a confirmar]',
        definicao: '[NÚMERO — definição a confirmar]',
        calculo: 'manual',
        valor: pending('[NÚMERO — valor, fonte e período a confirmar]'),
        fonte: pending('[FONTE — a confirmar]'),
        periodo: pending('[PERÍODO — a confirmar]'),
        verificadoEm: pending('[VERIFICADO EM — AAAA-MM]'),
      },
    ],
  }
}

export const empresas: Empresa[] = [placeholder(1), placeholder(2), placeholder(3), placeholder(4)]
