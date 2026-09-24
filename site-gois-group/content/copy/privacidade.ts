import { validar, type Texto } from '@/lib/conteudo'
import type { Maybe } from '@/lib/pending'
import { site } from '@/content/site'

/**
 * /privacidade/ (spec §14.8, §18.1): a estrutura de nove itens exigida pela LGPD, porque o formulário de
 * contato coleta dados pessoais. Texto final: vai ao ar exatamente como está escrito aqui.
 *
 * - Dados que só a Gois Group pode informar (controlador, CNPJ, retenção, provedor, encarregado, texto
 *   jurídico) vêm de `content/site.ts` como `pending('[…]')`: em homologação aparecem as instruções; em
 *   produção, o texto jurídico pendente quebra o build (spec §21.3) e a página fica `noindex` enquanto
 *   `site.privacidade.publicada` for `false`.
 * - `validar('…')` marca o que precisa de revisão jurídica ([VALIDAR: jurídico], spec §22.2, item 7).
 * - O item 9 é verdade por construção (spec §21.4): as duas únicas chaves de armazenamento do site são
 *   `sessionStorage['gg:intro']` e `sessionStorage['gg:dentro']`. Nada de cookies ou localStorage.
 */

export type Campo = { readonly rotulo: string; readonly valor: Maybe<string> }

export type Bloco =
  | { readonly tipo: 'texto'; readonly t: Texto }
  | { readonly tipo: 'lista'; readonly itens: readonly string[] }
  | { readonly tipo: 'campos'; readonly campos: readonly Campo[] }
  /** Segunda linha técnica (mono): nomes exatos, como aparecem no código. */
  | { readonly tipo: 'codigo'; readonly partes: readonly string[] }

export type ItemPrivacidade = { readonly id: string; readonly titulo: string; readonly blocos: readonly Bloco[] }

const p = site.privacidade

export const privacidade = {
  meta: {
    title: 'Política de privacidade',
    description: 'Como a Gois Group trata os dados enviados pelo formulário de contato deste site.',
  },
  h1: 'Política de privacidade.',
  lead: 'Como a Gois Group trata os dados enviados pelo formulário de contato deste site.',
  /** O texto jurídico completo, quando informado; até lá, a instrução em homologação. */
  textoJuridico: p.textoJuridico,
  /** Rótulo neutro de um dado ainda não informado, em produção (spec §7.2). */
  neutro: 'Pendente',

  itens: [
    {
      id: 'quem-somos',
      titulo: 'Quem somos',
      blocos: [
        {
          tipo: 'campos',
          campos: [
            { rotulo: 'Controlador', valor: p.controlador },
            { rotulo: 'CNPJ', valor: site.cnpj },
          ],
        },
      ],
    },
    {
      id: 'dados',
      titulo: 'Que dados coletamos',
      blocos: [
        { tipo: 'texto', t: 'Os campos do formulário de contato:' },
        {
          tipo: 'lista',
          itens: [
            'o que você quer construir;',
            'nome e e-mail;',
            'empresa, cargo e telefone ou WhatsApp, quando informados;',
            'as respostas sobre o projeto.',
          ],
        },
        { tipo: 'texto', t: 'Com a mensagem vão também a página de origem, a data e a hora do envio e a versão deste site.' },
      ],
    },
    {
      id: 'finalidade',
      titulo: 'Para quê',
      blocos: [{ tipo: 'texto', t: validar('Só para responder ao seu contato.') }],
    },
    {
      id: 'base-legal',
      titulo: 'Base legal',
      blocos: [
        {
          tipo: 'texto',
          t: validar(
            'Procedimentos preliminares relacionados a contrato, a pedido de quem escreve (Lei Geral de Proteção de Dados, art. 7º, V). Responder a um contato é o passo que vem antes de qualquer contrato.',
          ),
        },
      ],
    },
    {
      id: 'prazo',
      titulo: 'Por quanto tempo',
      blocos: [{ tipo: 'campos', campos: [{ rotulo: 'Prazo de guarda', valor: p.retencao }] }],
    },
    {
      id: 'compartilhamento',
      titulo: 'Com quem compartilhamos',
      blocos: [
        { tipo: 'texto', t: 'Com o serviço que recebe as mensagens do formulário.' },
        { tipo: 'campos', campos: [{ rotulo: 'Provedor', valor: p.compartilhamento }] },
      ],
    },
    {
      id: 'direitos',
      titulo: 'Seus direitos',
      blocos: [
        {
          tipo: 'texto',
          t: validar(
            'A Lei Geral de Proteção de Dados garante a você, entre outros, o direito de confirmar se tratamos seus dados, de acessá-los, de corrigi-los, de pedir que sejam eliminados e de saber com quem foram compartilhados (art. 18). Para exercer qualquer um deles, fale com o encarregado.',
          ),
        },
      ],
    },
    {
      id: 'encarregado',
      titulo: 'Como falar com o encarregado',
      blocos: [{ tipo: 'campos', campos: [{ rotulo: 'Encarregado', valor: p.encarregado }] }],
    },
    {
      id: 'armazenamento',
      titulo: 'Cookies e armazenamento',
      blocos: [
        {
          tipo: 'texto',
          t: 'Este site não usa cookies nem ferramentas de rastreamento. Guarda no seu navegador, só durante a sessão, duas preferências de navegação: se a abertura da página inicial já foi exibida e se a vista “por dentro” está ligada.',
        },
        { tipo: 'codigo', partes: ['sessionStorage', 'gg:intro', 'gg:dentro'] },
      ],
    },
  ] satisfies readonly ItemPrivacidade[],
}
