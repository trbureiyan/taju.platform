import { Link } from 'react-router-dom'
import type { Producto } from '../../types'
import { ETIQUETAS_FAMILIA } from '../../types'
import { contenidoDe } from '../vitrina/contenido'
import { ImagenProducto } from './ImagenProducto'
import { PrecioResumen } from './PrecioResumen'

/**
 * Props de la tarjeta de producto.
 * @prop producto - Producto con su categoría poblada.
 * @prop mostrarFamilia - true donde se mezclan familias (búsqueda, ocasión); en un estante sería redundante.
 */
interface ProductoCardProps {
  producto: Producto
  mostrarFamilia?: boolean
}

export function ProductoCard({ producto, mostrarFamilia = false }: ProductoCardProps) {
  const familia = producto.categoria.familia
  const ocasion = producto.especificacionesTecnicas.ocasion

  return (
    <article
      className={[
        'group relative flex flex-col gap-3 rounded-lg',
        'transition-transform duration-normal ease-estandar hover:-translate-y-1',
        // el foco vive en el enlace, pero se muestra en toda la tarjeta porque toda la tarjeta es clicable
        'has-[:focus-visible]:shadow-foco',
      ].join(' ')}
    >
      <div className="relative aspect-square overflow-hidden rounded-lg">
        <ImagenProducto producto={producto} className="absolute inset-0 w-full h-full" />
        {producto.imagenes[1] && (
          // segunda vista al hover (detalle del grabado o proceso); hover: en Tailwind v4 solo aplica con puntero
          <ImagenProducto
            producto={producto}
            indice={1}
            className="absolute inset-0 w-full h-full opacity-0 transition-opacity duration-lenta ease-estandar group-hover:opacity-100"
          />
        )}
      </div>

      <div className="flex flex-col gap-1">
        {mostrarFamilia && (
          <p className="flex items-center gap-2 text-xs font-medium text-texto-secundario">
            <span
              aria-hidden="true"
              className={['w-2 h-2 rounded-full', contenidoDe(familia).claseFondo].join(' ')}
            />
            {ETIQUETAS_FAMILIA[familia]}
          </p>
        )}
        <h3 className="font-medium text-texto-principal line-clamp-2">
          {/* un solo elemento interactivo: el ::after estira el clic a toda la tarjeta sin anidar controles */}
          <Link
            to={`/catalogo/${producto._id}`}
            className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:shadow-none"
          >
            {producto.nombre}
          </Link>
        </h3>
        <PrecioResumen precio={producto.precio} />
        {ocasion && <p className="text-xs text-texto-secundario">{ocasion}</p>}
      </div>
    </article>
  )
}
