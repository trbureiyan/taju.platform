import type { Producto } from '../../types'
import { etiquetaEspecificacion, referenciaMedida } from '../../lib/especificaciones'

/**
 * Franja de especificaciones a todo el ancho (Sunloop): claves traducidas y medidas como referencia de torta.
 * @prop producto - Producto con especificaciones y dimensiones de su categoría.
 */
export function FranjaEspecificaciones({ producto }: { producto: Producto }) {
  const especificaciones = Object.entries(producto.especificacionesTecnicas)
  const medidas = producto.categoria.dimensionesBase
  if (especificaciones.length === 0 && medidas.length === 0) return null

  return (
    <section aria-label="Especificaciones" className="border-y border-borde-fuerte py-8">
      <dl className="grid gap-x-8 gap-y-6 grid-cols-2 md:grid-cols-4">
        {especificaciones.map(([clave, valor]) => (
          <div key={clave} className="flex flex-col gap-1">
            <dt className="text-xs font-medium uppercase text-texto-secundario">{etiquetaEspecificacion(clave)}</dt>
            <dd className="font-medium text-texto-principal">{valor}</dd>
          </div>
        ))}
        {medidas.length > 0 && (
          <div className="flex flex-col gap-1 col-span-2">
            <dt className="text-xs font-medium uppercase text-texto-secundario">Medidas disponibles</dt>
            {medidas.map((d) => (
              <dd key={d.etiqueta} className="font-medium text-texto-principal medida">
                {referenciaMedida(d)}
              </dd>
            ))}
          </div>
        )}
      </dl>
    </section>
  )
}
