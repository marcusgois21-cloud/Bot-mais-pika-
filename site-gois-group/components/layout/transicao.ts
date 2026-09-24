/**
 * Corte entre páginas (spec §16), compartilhado pelo TransitionLink (cliques) e pelo NavigationListener
 * (voltar/avançar do navegador).
 *
 * - `atualizar` troca a rota dentro do callback da View Transition; a promessa resolve quando a rota nova
 *   monta (NavigationListener → resolverTransicoes) ou no teto de 300 ms.
 * - html[data-vt-dir] marca a direção e "navegação em curso" (o header para de animar; CapitulosCase lê).
 * - O header tem nome próprio e fica parado; recolhido ou com o menu aberto no início, ele entra no
 *   instantâneo da página (html[data-vt-header="raiz"]) e chega junto com a página nova, já no lugar.
 */
type VT = { finished: Promise<void> }
type DocVT = Document & { startViewTransition?: (cb: () => Promise<void>) => VT }

let pendentes: Array<() => void> = []
let vez = 0

export function resolverTransicoes() {
  const r = pendentes
  pendentes = []
  r.forEach(fn => fn())
}

export function suportaTransicao() {
  return typeof (document as DocVT).startViewTransition === 'function'
}

export function cortar(dir: 'forward' | 'back', atualizar: () => void): Promise<void> | null {
  const doc = document as DocVT
  if (typeof doc.startViewTransition !== 'function') return null
  const html = document.documentElement
  const header = document.querySelector('.site-header')
  const minha = ++vez
  html.dataset.vtDir = dir
  if (header?.hasAttribute('data-recolhido') || header?.hasAttribute('data-aberto')) html.dataset.vtHeader = 'raiz'
  else delete html.dataset.vtHeader

  const vt = doc.startViewTransition(
    () =>
      new Promise<void>(resolve => {
        pendentes.push(resolve)
        atualizar()
        window.setTimeout(resolve, 300)
      }),
  )
  const fim = () => {
    if (minha !== vez) return // outra transição já começou: ela limpa
    delete html.dataset.vtDir
    delete html.dataset.vtHeader
    window.dispatchEvent(new Event('gg:vt-fim'))
  }
  return vt.finished.then(fim, fim)
}
