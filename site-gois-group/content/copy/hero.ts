/**
 * Copy do hero da Home (spec §1.4, §6 e §8 · Hero). Texto final: vai ao ar exatamente como está.
 *
 * Nenhum item do hero é compromisso [VALIDAR] nem dado [PENDENTE]: tudo o que aparece com número
 * (colunas, medidas, contraste, data e hash da versão) é medido no navegador ou vem do build.
 *
 * Os modelos recebem valores JÁ formatados em pt-BR (lib/formatar): este arquivo não tem imports,
 * para poder ser lido também pelo teste em Node de `components/hero/levantamento.ts`.
 * Unidades sempre separadas por U+00A0; o travessão, preso à palavra anterior por U+00A0 (nunca abre linha).
 */

const NBSP = ' '

export type HeroCopy = {
  eyebrow: string
  /** O H1 em três linhas (≥ 600 px) ou quatro (< 600 px): "sites" desce sozinho no mobile. */
  titulo: { construimos: string; sites: string; deDentro: string; paraFora: string }
  subtitulo: string
  ctaPrimario: { rotulo: string; href: string }
  ctaSecundario: { rotulo: string; href: string }
  /** Legenda de uma linha sob os CTAs (sem anotações): `toque` quando a rolagem move o corte (toque, abaixo de 900 px) · `tela` nos demais. */
  legenda: { tela: string; toque: string }
  dica: { cursor: string; teclado: string }
  corte: {
    rotulo: string
    naColuna: (coluna: string, total: string) => string
    depoisDaUltima: string
  }
  anotacoes: {
    grade: { principal: (colunas: string) => string; tecnica: (colW: string, g: string, m: string) => string[] }
    titulo: { principal: string; tecnica: (peso: string, fs: string, lh: string) => string[] }
    leitura: { principal: string; tecnica: string[] }
    botao: { principal: (h: string) => string; tecnica: (contraste: string) => string[] }
    versao: { principal: (data: string) => string; tecnica: (hash: string) => string[] }
  }
  /** Rótulo de cota: valor em px, mono, caixa alta. */
  cota: (px: string) => string
}

export const heroCopy: HeroCopy = {
  eyebrow: `Gois Group${NBSP}— desenvolvimento de sites, plataformas e sistemas web`,
  titulo: { construimos: 'Construímos', sites: 'sites', deDentro: 'de dentro', paraFora: 'para fora.' },
  subtitulo:
    `Projetamos e desenvolvemos sites, plataformas e sistemas web para empresas. Começamos pela parte que não aparece${NBSP}— arquitetura, código, dados e velocidade${NBSP}— e desenhamos a que aparece com o mesmo rigor.`,
  ctaPrimario: { rotulo: 'Iniciar um projeto', href: '/contato/?origem=home-hero' },
  ctaSecundario: { rotulo: 'Ver como construímos', href: '#metodo' },
  legenda: {
    tela: 'À direita do corte: a grade, as linhas de leitura e as áreas de toque do botão e do link acima.',
    toque: 'Role a página: o corte mostra este site por dentro.',
  },
  dica: {
    cursor: 'Mova o cursor: à direita do corte, este site por dentro.',
    teclado: 'Setas movem o corte coluna a coluna.',
  },
  corte: {
    rotulo: 'Corte: mova para ver este site por dentro',
    naColuna: (coluna, total) => `Corte na coluna ${coluna} de ${total}`,
    depoisDaUltima: 'Corte depois da última coluna',
  },
  anotacoes: {
    grade: {
      principal: colunas => `Grade de ${colunas} colunas: tudo nesta página se alinha a ela.`,
      tecnica: (colW, g, m) => [`COLUNA ${colW}${NBSP}PX`, `INTERVALO ${g}${NBSP}PX`, `MARGEM ${m}${NBSP}PX`],
    },
    titulo: {
      principal: 'Título: a primeira coisa que se lê.',
      tecnica: (peso, fs, lh) => [`ARCHIVO ${peso}`, `${fs}${NBSP}PX`, `ENTRELINHA ${lh}${NBSP}PX`],
    },
    leitura: {
      principal: 'Linhas de leitura: toda letra se apoia nelas.',
      tecnica: ['VERSAL', 'ALTURA-X', 'LINHA DE BASE'],
    },
    botao: {
      principal: h => `Botão principal: ${h}${NBSP}px de altura, fácil de acertar.`,
      tecnica: contraste => [`CONTRASTE ${contraste}:1`, 'MÍNIMO WCAG AA 4,5:1'],
    },
    versao: {
      principal: data => `Esta versão do site foi publicada em ${data}.`,
      tecnica: hash => [`BUILD ${hash}`],
    },
  },
  cota: px => `${px}${NBSP}PX`,
}
