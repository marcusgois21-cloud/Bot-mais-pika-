/**
 * Placeholders honestos.
 *
 * Todo dado factual da Gois Group que ainda não foi informado (empresas, números,
 * cases, contatos, redes, dados legais) é um `Pending`. Ele carrega a instrução do
 * que deve ser inserido e é renderizado com um estado visual próprio, nunca como
 * se fosse um dado real. Para publicar um dado, troque `pending('...')` pelo valor.
 */
export type Pending = { readonly __pending: true; readonly hint: string }

export type Maybe<T> = T | Pending

export const pending = (hint: string): Pending => ({ __pending: true, hint })

export function isPending(value: unknown): value is Pending {
  return typeof value === 'object' && value !== null && (value as Pending).__pending === true
}

/** Valor real ou `undefined` — útil para metadados/SEO, que nunca recebem placeholder. */
export function known<T>(value: Maybe<T> | undefined): T | undefined {
  return value === undefined || isPending(value) ? undefined : value
}
