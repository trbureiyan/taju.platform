import { m } from 'motion/react'
import { ProductoCard } from './ProductoCard'
import { resorte } from '../../lib/movimiento'
import type { Producto } from '../../types'

/**
 * Grilla de tarjetas: 2 columnas en teléfono, 3 desde md, 4 desde xl.
 * Al filtrar, las tarjetas se desplazan a su nuevo lugar (layout) en vez de saltar.
 * @prop productos - Productos a mostrar.
 * @prop mostrarFamilia - Pasa a cada tarjeta si debe decir su familia.
 */
export function GrillaProductos({
  productos,
  mostrarFamilia = false,
}: {
  productos: Producto[]
  mostrarFamilia?: boolean
}) {
  return (
    <ul className="grid gap-x-4 gap-y-8 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
      {productos.map((p, i) => (
        <m.li
          key={p._id}
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          // escalonado corto: con 100 productos un retraso largo haria esperar la ultima fila
          transition={{
            ...resorte('efectosNormal'),
            delay: Math.min(i, 8) * 0.03,
            layout: resorte('espacialNormal'),
          }}
        >
          <ProductoCard producto={p} mostrarFamilia={mostrarFamilia} />
        </m.li>
      ))}
    </ul>
  )
}
