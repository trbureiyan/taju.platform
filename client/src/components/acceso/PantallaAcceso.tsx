import type { ReactNode } from 'react'

/**
 * Contenedor compartido de registro e ingreso. En móvil la constancia es la franja sobre los campos; en escritorio
 * (lg) la constancia queda en el lado de presencia, a la izquierda, y el formulario a la derecha.
 * @prop titulo - Titular: explica el motivo de la cuenta.
 * @prop apoyo - Frase de apoyo bajo el titular.
 * @prop constancia - La constancia (franja u hoja según el ancho).
 */
interface PantallaAccesoProps {
  titulo: string
  apoyo: string
  constancia: ReactNode
  children: ReactNode
}

export function PantallaAcceso({ titulo, apoyo, constancia, children }: PantallaAccesoProps) {
  return (
    <div className="mx-auto max-w-5xl py-6 lg:py-12">
      <header className="mb-6 flex max-w-2xl flex-col gap-2">
        <h1 className="text-h1 font-semibold text-texto-principal">{titulo}</h1>
        <p className="text-base text-texto-secundario">{apoyo}</p>
      </header>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:gap-12">
        <aside className="min-w-0">{constancia}</aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  )
}
