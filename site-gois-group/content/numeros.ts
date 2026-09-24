import { pending } from '@/lib/pending'
import type { Medida } from '@/lib/conteudo'
import { empresas } from './empresas'
import { publicada } from '@/lib/conteudo'
import { isPending } from '@/lib/pending'

/**
 * Números da Gois Group (spec §13). Número só com fonte, período e data de verificação.
 * "Derivado" = calculado a partir das empresas publicadas neste site. "Manual" = informado pela Gois Group.
 */
const publicadas = empresas.filter(publicada)
const segmentos = new Set(publicadas.map(e => (isPending(e.segmento) ? null : e.segmento)).filter(Boolean))

export const numerosHome: Medida[] = [
  {
    id: 'empresas',
    rotulo: 'Empresas no ecossistema',
    definicao: 'Empresas com estrutura digital construída ou operada pela Gois Group e publicação autorizada.',
    calculo: 'derivado',
    valor: publicadas.length,
    fonte: 'Este site',
    periodo: 'Atual',
    verificadoEm: 'build',
  },
  {
    id: 'lancados',
    rotulo: 'Sites e sistemas lançados',
    definicao: 'Sites, plataformas e sistemas colocados no ar pela Gois Group.',
    calculo: 'manual',
    valor: pending('[NÚMERO — sites e sistemas lançados: valor, fonte e período a confirmar]'),
    fonte: pending('[FONTE — registro interno de projetos]'),
    periodo: pending('[PERÍODO — a confirmar]'),
    verificadoEm: pending('[VERIFICADO EM — AAAA-MM]'),
  },
  {
    id: 'segmentos',
    rotulo: 'Segmentos atendidos',
    definicao: 'Segmentos de mercado distintos entre as empresas publicadas.',
    calculo: 'derivado',
    valor: segmentos.size,
    fonte: 'Este site',
    periodo: 'Atual',
    verificadoEm: 'build',
  },
  {
    id: 'alcance',
    rotulo: 'Pessoas alcançadas por mês',
    definicao:
      'Visitantes únicos mensais somados dos sites operados pela Gois Group, com autorização de cada empresa e período informado.',
    calculo: 'manual',
    valor: pending('[NÚMERO — visitantes únicos mensais: valor, fonte e período a confirmar]'),
    fonte: pending('[FONTE — medição das empresas]'),
    periodo: pending('[PERÍODO — a confirmar]'),
    verificadoEm: pending('[VERIFICADO EM — AAAA-MM]'),
  },
]

/** Não entra na Home enquanto pendente (spec §13.1). Aparece na seção 07 quando confirmado. */
export const lcpSitesEntregues: Medida = {
  id: 'lcp-p75',
  rotulo: 'Velocidade dos sites entregues',
  definicao: 'Tempo até o conteúdo principal aparecer (LCP, p75) na mediana dos sites entregues.',
  unidade: 's',
  calculo: 'manual',
  valor: pending('[NÚMERO — LCP p75 dos sites entregues]'),
  fonte: pending('[FONTE — Chrome UX Report / Search Console]'),
  periodo: pending('[PERÍODO — a confirmar]'),
  verificadoEm: pending('[VERIFICADO EM — AAAA-MM]'),
}
