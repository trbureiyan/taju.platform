import { useState } from 'react'
import { PiezaSilueta } from '../vitrina/PiezaSilueta'
import { contenidoDe } from '../vitrina/contenido'
import type { Producto } from '../../types'

/**
 * Imagen principal de un producto, o la silueta de su familia si no hay foto o la foto falla.
 * @prop producto - Producto a mostrar.
 * @prop indice - Qué foto mostrar (0 la principal).
 * @prop className - Tamaño y radio del cuadro.
 */
export function ImagenProducto({
  producto,
  indice = 0,
  className = '',
}: {
  producto: Producto
  indice?: number
  className?: string
}) {
  // la url que ya fallo no se vuelve a intentar: el cuadro pasa a la silueta y se queda ahi
  const [rota, setRota] = useState(false)
  const url = producto.imagenes[indice]
  const familia = producto.categoria.familia

  if (!url || rota) {
    // del trazo a la pieza: sin foto se ve la ruta de corte sobre el color de la familia, nunca un gris generico
    return (
      <div
        data-testid="silueta"
        className={[
          'flex items-center justify-center text-texto-principal p-8',
          contenidoDe(familia).claseFondo,
          className,
        ].join(' ')}
      >
        <PiezaSilueta silueta={contenidoDe(familia).silueta} className="w-full h-full max-w-48" />
      </div>
    )
  }

  return (
    <img
      src={url}
      alt={producto.nombre}
      loading="lazy"
      onError={() => setRota(true)}
      className={['object-cover', className].join(' ')}
    />
  )
}
