import { FAMILIAS } from '../types'
import type { Familia, Producto } from '../types'
import { precioParaOrden } from './precio'

export type Orden = 'recomendados' | 'precio-asc' | 'precio-desc' | 'nombre'

export const ETIQUETAS_ORDEN: Record<Orden, string> = {
  recomendados: 'Recomendados',
  'precio-asc': 'Precio: menor a mayor',
  'precio-desc': 'Precio: mayor a menor',
  nombre: 'Nombre',
}

export interface FiltrosCatalogo {
  familia: Familia | null
  q: string
  ocasion: string | null
}

/**
 * Normaliza texto para comparar: sin tildes ni diacríticos, en minúscula y sin espacios en los extremos.
 * @param texto - Texto de entrada.
 * @returns Texto comparable ("Señalética" → "senaletica").
 */
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
}

/**
 * Aplica familia, búsqueda y ocasión. La búsqueda mira el nombre del producto y el de su categoría.
 * @param productos - Catálogo completo.
 * @param filtros - Familia (null = todas), texto buscado y ocasión (null = todas).
 * @returns Los productos que cumplen todos los filtros, en su orden original.
 */
export function filtrarProductos(productos: Producto[], { familia, q, ocasion }: FiltrosCatalogo): Producto[] {
  const buscado = normalizar(q)
  return productos.filter(
    (p) =>
      (!familia || p.categoria.familia === familia) &&
      (!ocasion || p.especificacionesTecnicas.ocasion === ocasion) &&
      // en el telefono casi nadie escribe tildes: "cumpleanos" tiene que encontrar "Cumpleaños"
      (!buscado || normalizar(`${p.nombre} ${p.categoria.nombre}`).includes(buscado)),
  )
}

/**
 * Ordena sin mutar la lista. "Recomendados" conserva el orden en que el taller cargó los productos.
 * @param productos - Lista a ordenar.
 * @param orden - Criterio.
 * @returns Una lista nueva. Por precio, los productos sin precio ("Te lo cotizamos") van siempre al final.
 */
export function ordenarProductos(productos: Producto[], orden: Orden): Producto[] {
  const copia = [...productos]
  if (orden === 'nombre') return copia.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  if (orden === 'recomendados') return copia

  const signo = orden === 'precio-asc' ? 1 : -1
  return copia.sort((a, b) => {
    const pa = precioParaOrden(a.precio)
    const pb = precioParaOrden(b.precio)
    if (pa === null && pb === null) return 0
    if (pa === null) return 1
    if (pb === null) return -1
    return (pa - pb) * signo
  })
}

/**
 * Agrupa por familia para los estantes, en el orden del enum y sin familias vacías.
 * @param productos - Productos ya filtrados y ordenados.
 * @returns Un grupo por familia con productos.
 */
export function agruparPorFamilia(productos: Producto[]): { familia: Familia; productos: Producto[] }[] {
  return FAMILIAS.map((familia) => ({
    familia,
    productos: productos.filter((p) => p.categoria.familia === familia),
  })).filter((g) => g.productos.length > 0)
}
