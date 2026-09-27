import { useCatalogo } from '../../hooks/useCatalogo'
import { ETIQUETAS_FAMILIA } from '../../types'
import type { Producto } from '../../types'
import { GrillaProductos } from '../catalog/GrillaProductos'

/**
 * Cuatro productos más de la misma familia, para seguir mirando sin volver al catálogo.
 * Si el catálogo no carga, la sección simplemente no aparece: es un extra, no el contenido de la página.
 * @prop producto - Producto actual (se excluye de la lista).
 */
export function MasDeFamilia({ producto }: { producto: Producto }) {
  const { productos } = useCatalogo()
  const familia = producto.categoria.familia
  const otros = productos.filter((p) => p.categoria.familia === familia && p._id !== producto._id).slice(0, 4)
  if (otros.length === 0) return null

  return (
    <section aria-labelledby="mas-de-familia" className="flex flex-col gap-6">
      <h2 id="mas-de-familia" className="text-h3 text-texto-principal">
        Más {ETIQUETAS_FAMILIA[familia].toLowerCase()}
      </h2>
      <GrillaProductos productos={otros} />
    </section>
  )
}
