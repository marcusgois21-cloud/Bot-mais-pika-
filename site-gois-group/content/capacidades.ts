import { validar, type Texto } from '@/lib/conteudo'

/**
 * Capacidades (spec §11): quatro disciplinas. Os termos do brief aparecem entre parênteses para
 * rastrear a cobertura (12 de 12). A seção 05.1 mostra as quatro decidindo o mesmo botão.
 */
export type Disciplina = {
  nome: 'Estratégia' | 'Design' | 'Engenharia' | 'Operação'
  responde: string
  capacidades: string[]
  /** faixa da seção "Um botão atravessa quatro disciplinas" */
  pergunta: string
  decisao: Texto
  /** o que a faixa realça no botão ao passar o cursor */
  realce: 'promessa' | 'botao' | 'estados' | 'envio'
}

export const disciplinas: Disciplina[] = [
  {
    nome: 'Estratégia',
    responde: 'Isso deve existir? Para quem?',
    capacidades: [
      'Estratégia digital (Strategy)',
      'Modelo de negócio e jornada (Business Design)',
      'Definição de produto (Product)',
      'Arquitetura de informação',
      'Conteúdo',
    ],
    pergunta: 'Ele deve existir? Para quem? O que promete?',
    decisao: validar(
      'Promete uma leitura do seu caso, não um orçamento genérico. Aparece no topo para quem já decidiu e de novo depois das provas, para quem precisava delas.',
    ),
    realce: 'promessa',
  },
  {
    nome: 'Design',
    responde: 'Como é visto e entendido?',
    capacidades: ['Identidade digital (Branding)', 'Design de interface', 'Design system', 'Motion', 'Redação'],
    pergunta: 'Como ele é lido em meio segundo?',
    // {contraste} e {altura} são derivados no build a partir de styles/tokens.css (scripts/derive-tokens.mjs)
    decisao: 'Rótulo com verbo, contraste de {contraste}:1, {altura} px de altura e foco visível para quem navega pelo teclado.',
    realce: 'botao',
  },
  {
    nome: 'Engenharia',
    responde: 'Como funciona, rápido e sem falhar?',
    capacidades: [
      'Front-end e back-end (Technology, Engineering)',
      'Integrações e APIs',
      'Desempenho e acessibilidade',
      'Infraestrutura e segurança',
    ],
    pergunta: 'O que acontece quando alguém toca nele?',
    decisao:
      'Leva ao formulário já sabendo de onde você veio. O formulário valida cada campo, envia sem recarregar a página, se protege de spam e, se a rede falhar, oferece o envio por e-mail com a mensagem pronta.',
    realce: 'estados',
  },
  {
    nome: 'Operação',
    responde: 'O que se aprende depois, e o que muda?',
    capacidades: [
      'Dados e medição (Data)',
      'SEO contínuo e aquisição (Growth, Marketing)',
      'Automação e IA aplicada (Automation, AI)',
      'Operação contínua (Operations)',
    ],
    pergunta: 'O que a empresa aprende depois?',
    decisao:
      'Cada mensagem chega com o tipo de conversa e a página de origem, para que a primeira resposta já parta do contexto certo.',
    realce: 'envio',
  },
]
