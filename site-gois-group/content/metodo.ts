import { validar, type Texto } from '@/lib/conteudo'

/**
 * Método Prumo — Versão 1 (spec §10). Seis fases; nenhuma começa sem que a anterior cumpra o seu
 * critério de passagem. A sexta não termina: cada ciclo volta à Leitura com dados reais.
 * Mudanças futuras ganham nova versão e uma nota em `notas`.
 */
export type Fase = {
  codigo: `P${1 | 2 | 3 | 4 | 5 | 6}`
  nome: string
  verbo: string
  acontece: string
  artefatos: string[]
  passaQuando: Texto
}

export const metodo = {
  nome: 'Método Prumo',
  versao: 1,
  notas: [] as string[],
  fases: [
    {
      codigo: 'P1',
      nome: 'Leitura',
      verbo: 'Ler',
      acontece:
        'Entendemos a empresa antes do site: modelo de negócio, públicos, concorrência, operação, o que existe hoje e o que está falhando.',
      artefatos: [
        'Mapa do negócio',
        'Auditoria do site atual (desempenho, SEO, acessibilidade, medição), quando existe',
        'Tese do projeto em uma frase',
        'Métricas de sucesso com linha de base',
      ],
      passaQuando: validar('Tese e métricas aprovadas por escrito por quem decide.'),
    },
    {
      codigo: 'P2',
      nome: 'Arquitetura',
      verbo: 'Estruturar',
      acontece:
        'Definimos o que precisa existir e onde: páginas, fluxos, conteúdos, integrações e a tecnologia que vai sustentar tudo.',
      artefatos: [
        'Mapa do site e fluxos principais',
        'Modelo de conteúdo',
        'Especificação técnica e escolha de tecnologia',
        'Orçamento de desempenho',
        'Plano de SEO e de migração',
      ],
      passaQuando: validar('Toda página tem objetivo, métrica e responsável. Orçamento de desempenho aprovado.'),
    },
    {
      codigo: 'P3',
      nome: 'Desenho',
      verbo: 'Desenhar',
      acontece:
        'Desenhamos o sistema visual e de interação que vai sustentar todas as páginas, inclusive as que ainda não existem.',
      artefatos: [
        'Design tokens',
        'Biblioteca de componentes',
        'Protótipo navegável em todos os tamanhos de tela',
        'Textos finais',
        'Especificação de movimento e acessibilidade',
      ],
      passaQuando: validar('Protótipo aprovado em aparelho real, contraste verificado, textos aprovados.'),
    },
    {
      codigo: 'P4',
      nome: 'Construção',
      verbo: 'Construir',
      acontece:
        'Engenharia de front-end e back-end, gerenciador de conteúdo, integrações e testes, em ciclos curtos e visíveis num ambiente de homologação.',
      artefatos: [
        'Código versionado',
        'Ambiente de homologação',
        'Testes automatizados',
        'Relatórios de acessibilidade e de desempenho contra o orçamento',
      ],
      passaQuando: validar(
        'Orçamento cumprido, nenhuma falha crítica de acessibilidade, testes passando, conteúdo real carregado.',
      ),
    },
    {
      codigo: 'P5',
      nome: 'Lançamento',
      verbo: 'Colocar no ar',
      acontece:
        'Migração, redirecionamentos, SEO técnico, medição e monitoramento. Publicação com plano de reversão.',
      artefatos: ['Checklist de lançamento', 'Mapa de redirecionamentos', 'Plano de medição', 'Plano de reversão'],
      passaQuando: validar('No ar, medindo, e com o período de estabilização concluído sem erro crítico.'),
    },
    {
      codigo: 'P6',
      nome: 'Evolução',
      verbo: 'Evoluir',
      acontece:
        'Ciclos contínuos: medir, formular uma hipótese, mudar, medir de novo. Manutenção, segurança, novas páginas e funções.',
      artefatos: ['Relatório de ciclo', 'Backlog priorizado', 'Registro de mudanças'],
      passaQuando: 'Não fecha. Cada ciclo volta à Leitura, agora com dados reais.',
    },
  ] satisfies Fase[],
}
