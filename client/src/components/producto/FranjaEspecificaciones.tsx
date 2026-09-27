import type { ReactNode } from 'react'
import type { Producto } from '../../types'
import { etiquetaEspecificacion, referenciaMedida } from '../../lib/especificaciones'

export interface ParEspecificacion {
  etiqueta: string
  valor: ReactNode
}

/**
 * Especificaciones de un producto como pares etiqueta/valor, en el orden que muestra la franja.
 * @param producto - Producto con especificaciones y dimensiones de su categoría.
 */
export function paresDeProducto(producto: Producto): ParEspecificacion[] {
  const pares: ParEspecificacion[] = Object.entries(producto.especificacionesTecnicas).map(([clave, valor]) => ({
    etiqueta: etiquetaEspecificacion(clave),
    valor,
  }))
  if (producto.categoria.dimensionesBase.length > 0) {
    pares.push({
      etiqueta: 'Medidas disponibles',
      valor: (
        <div className="flex flex-col gap-1">
          {producto.categoria.dimensionesBase.map((d) => (
            <span key={d.etiqueta} className="medida">
              {referenciaMedida(d)}
            </span>
          ))}
        </div>
      ),
    })
  }
  return pares
}

/**
 * Franja de especificaciones a todo el ancho (Sunloop): pares etiqueta/valor genéricos, reusada por el
 * detalle de producto (`paresDeProducto`) y el detalle de pedido ("Lo que pediste").
 * @prop pares - Pares etiqueta/valor ya armados por quien la usa.
 */
export function FranjaEspecificaciones({ pares }: { pares: ParEspecificacion[] }) {
  if (pares.length === 0) return null

  return (
    <section aria-label="Especificaciones" className="border-y border-borde-fuerte py-8">
      <dl className="grid gap-x-8 gap-y-6 grid-cols-2 md:grid-cols-4">
        {pares.map(({ etiqueta, valor }) => (
          <div key={etiqueta} className="flex flex-col gap-1">
            <dt className="text-xs font-medium uppercase text-texto-secundario">{etiqueta}</dt>
            <dd className="font-medium text-texto-principal">{valor}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
