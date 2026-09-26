import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

type Variante = 'primario' | 'secundario'

/**
 * Enlace con apariencia de botón. Link envolviendo un <button> anidaría dos controles interactivos.
 * @prop to - Ruta destino (admite query y hash).
 * @prop variante - 'primario' (amarillo, una sola por pantalla) o 'secundario' (borde en tinta).
 * @prop children - Texto de la acción concreta ("Ver el catálogo", no "Ver").
 */
export function EnlaceBoton({
  to,
  variante = 'primario',
  children,
}: {
  to: string
  variante?: Variante
  children: ReactNode
}) {
  const estilos =
    variante === 'primario'
      ? 'bg-accion text-accion-texto hover:bg-accion-hover'
      : 'bg-accion-sec-fondo text-accion-sec-texto border border-accion-sec-borde hover:bg-superficie-elevada'

  return (
    <Link
      to={to}
      data-variante={variante}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-boton font-medium min-h-boton px-boton-x',
        'transition-[background-color,transform] duration-normal ease-estandar active:scale-97',
        estilos,
      ].join(' ')}
    >
      {children}
    </Link>
  )
}
