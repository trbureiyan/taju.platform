import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Producto } from '../../types'
import { ETIQUETAS_FAMILIA } from '../../types'
import { formatearPrecio } from '../../lib/precio'

/**
 * Props de la tarjeta de producto en el catálogo.
 * @prop producto - Producto a mostrar; se espera que venga poblado con su categoría.
 */
interface ProductoCardProps {
  producto: Producto
}

// placeholder externo, no bundleado - se usa tanto cuando no hay fotos como cuando la url guardada falla
const PLACEHOLDER = 'https://placehold.co/400x400/e2e8f0/94a3b8?text=Sin+imagen'

export function ProductoCard({ producto }: ProductoCardProps) {
  // el fallback original solo cubria "sin fotos"; si la url de Cloudinary devuelve 404 la imagen se ve rota -
  // este estado cambia la fuente al primer error y no se vuelve a intentar la url que ya fallo
  const [imagenRota, setImagenRota] = useState(false)
  const imagenSrc = !imagenRota && producto.imagenes[0] ? producto.imagenes[0] : PLACEHOLDER

  return (
    <article className="rounded-tarjeta border border-borde-defecto bg-superficie-elevada overflow-hidden hover:shadow-tarjeta transition-shadow">
      <div className="aspect-square overflow-hidden bg-superficie-hundida">
        <img
          src={imagenSrc}
          alt={producto.nombre}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setImagenRota(true)}
        />
      </div>
      <div className="p-4 flex flex-col gap-2">
        <span className="text-xs font-medium text-accion uppercase tracking-wide">
          {ETIQUETAS_FAMILIA[producto.categoria.familia]}
        </span>
        <h3 className="font-medium text-texto-principal leading-snug">{producto.nombre}</h3>
        <p className="text-sm text-texto-secundario line-clamp-2">{producto.descripcionTecnica}</p>
        <p className="text-sm font-medium text-texto-principal tabular-nums">
          {formatearPrecio(producto.precio)}
        </p>
        <Link
          to={`/catalogo/${producto._id}`}
          className="mt-auto text-sm font-medium text-accion hover:underline focus-visible:outline-none focus-visible:shadow-foco rounded-sm"
        >
          Ver detalles
        </Link>
      </div>
    </article>
  )
}
