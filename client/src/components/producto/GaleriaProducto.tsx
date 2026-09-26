import { useState } from 'react'
import { m } from 'motion/react'
import type { PanInfo } from 'motion/react'
import type { Producto } from '../../types'
import { ImagenProducto } from '../catalog/ImagenProducto'

/**
 * Galería del detalle: foto grande (o silueta) y miniaturas; en táctil también se desliza con el dedo.
 * @prop producto - Producto a mostrar.
 */
export function GaleriaProducto({ producto }: { producto: Producto }) {
  const [actual, setActual] = useState(0)
  const total = producto.imagenes.length

  function alSoltar(_: unknown, info: PanInfo) {
    if (info.offset.x < -64 && actual < total - 1) setActual(actual + 1)
    else if (info.offset.x > 64 && actual > 0) setActual(actual - 1)
  }

  return (
    <div className="flex flex-col gap-3">
      <m.div
        drag={total > 1 ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.3}
        onDragEnd={alSoltar}
        className="relative aspect-square overflow-hidden rounded-lg touch-pan-y"
      >
        {/* key por indice: la silueta de respaldo se recalcula si una foto puntual falla */}
        <ImagenProducto key={actual} producto={producto} indice={actual} className="absolute inset-0 w-full h-full" />
      </m.div>

      {total > 1 && (
        <ul className="flex gap-2" aria-label="Fotos del producto">
          {producto.imagenes.map((_, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => setActual(i)}
                aria-label={`Ver foto ${i + 1} de ${total}`}
                aria-current={i === actual}
                className={[
                  'relative block w-16 h-16 overflow-hidden rounded-md border-2 transition-colors duration-normal ease-estandar',
                  i === actual ? 'border-borde-fuerte' : 'border-transparent',
                ].join(' ')}
              >
                <ImagenProducto producto={producto} indice={i} className="absolute inset-0 w-full h-full" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
