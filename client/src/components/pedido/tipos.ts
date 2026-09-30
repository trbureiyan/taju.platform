import type { RefObject } from 'react'
import type { Campos, Errores } from '../../lib/validarSolicitud'
import type { Producto } from '../../types'

/** Lo que recibe cada momento del formulario desde la carcasa (ver useSolicitud). */
export interface PropsMomento {
  producto: Producto
  campos: Campos
  errores: Errores
  set: (campo: keyof Campos, valor: string) => void
  // el titulo recibe el foco al llegar al momento
  tituloRef: RefObject<HTMLHeadingElement>
}

/** Clase del titulo (h2) de cada momento; outline-none porque recibe el foco por codigo, no por teclado. */
export const CLASE_TITULO = 'text-h3 font-semibold text-texto-principal outline-none'
