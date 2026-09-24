/** Rótulo de seção: Archivo 500, caixa de frase, --text-3. Sem números de seção (spec D10). */
export function Rotulo({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <p className={`t-eyebrow secao__rotulo ${className ?? ''}`} id={id}>
      {children}
    </p>
  )
}
