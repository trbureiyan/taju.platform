import { Link } from 'react-router-dom'
import { ETIQUETAS_FAMILIA } from '../../types'
import type { Familia, Producto } from '../../types'
import { contenidoDe } from '../vitrina/contenido'
import { GrillaProductos } from './GrillaProductos'

// una fila por familia: las cuatro familias caben en poco scroll y quien quiere mas entra a la familia
const POR_ESTANTE = 4

/**
 * Estante de una familia en la vista "Todas".
 * @prop familia - Familia del estante.
 * @prop productos - Todos sus productos (se muestran los primeros cuatro).
 * @prop href - Enlace a la familia completa.
 */
export function EstanteFamilia({
  familia,
  productos,
  href,
}: {
  familia: Familia
  productos: Producto[]
  href: string
}) {
  const nombre = ETIQUETAS_FAMILIA[familia]
  return (
    <section aria-label={nombre} className="flex flex-col gap-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="flex items-center gap-3 text-h3 text-texto-principal">
          <span
            aria-hidden="true"
            className={['w-3 h-3 rounded-full', contenidoDe(familia).claseFondo].join(' ')}
          />
          {nombre}
        </h2>
        <Link
          to={href}
          className="inline-flex items-center min-h-boton text-sm font-medium text-texto-principal underline underline-offset-4"
        >
          {`${contenidoDe(familia).cta} (${productos.length}) →`}
        </Link>
      </div>
      <GrillaProductos productos={productos.slice(0, POR_ESTANTE)} />
    </section>
  )
}
