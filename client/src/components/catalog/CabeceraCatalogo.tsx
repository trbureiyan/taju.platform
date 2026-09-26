import type { ReactNode } from 'react'
import { ETIQUETAS_FAMILIA } from '../../types'
import type { Familia } from '../../types'
import { contenidoDe } from '../vitrina/contenido'

/**
 * Banda de cabecera: crema con todas las familias, el color de la familia cuando hay una elegida.
 * El texto de cada familia sale de vitrina/contenido.ts, la misma fuente que la Vitrina.
 * @prop familia - Familia actual o null.
 * @prop children - La navegación de familias.
 */
export function CabeceraCatalogo({
  familia,
  children,
}: {
  familia: Familia | null
  children: ReactNode
}) {
  const fondo = familia ? contenidoDe(familia).claseFondo : 'bg-superficie-calida'
  return (
    <header
      className={['px-4 pt-12 pb-6 transition-colors duration-lenta ease-estandar', fondo].join(
        ' '
      )}
    >
      <div className="w-full max-w-contenedor mx-auto flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <h1 className="text-h1 lg:text-display-xl text-texto-principal">
            {familia ? ETIQUETAS_FAMILIA[familia] : 'Catálogo'}
          </h1>
          <p className="text-lg text-texto-principal">
            {familia
              ? contenidoDe(familia).descripcion
              : 'Toppers, blondas, letreros y papelería cortados en láser en Neiva. Elige una familia o busca por nombre.'}
          </p>
        </div>
        {children}
      </div>
    </header>
  )
}
