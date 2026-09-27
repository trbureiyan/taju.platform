import { partesPrecio, formatearPesos } from '../../lib/precio'
import type { Precio } from '../../types'

/**
 * Precio del detalle. Por escala muestra todas las escalas: el cliente profesional las ve sin preguntar (identidad §3).
 * @prop precio - Precio del producto.
 */
export function BloquePrecio({ precio }: { precio: Precio }) {
  const partes = partesPrecio(precio)

  if (partes.tipo === 'consultar') {
    return <p className="text-lg text-texto-principal">Te lo cotizamos apenas nos cuentes qué necesitas.</p>
  }
  if (partes.tipo === 'unidad') {
    return <p className="text-h2 font-semibold text-texto-principal precio">{formatearPesos(partes.valor)}</p>
  }

  const escalas = [...precio.escalas].sort((a, b) => a.cantidadMinima - b.cantidadMinima)
  return (
    <table className="w-full text-left" aria-label="Precios por cantidad">
      <thead>
        <tr className="border-b border-borde-fuerte text-sm">
          <th scope="col" className="py-2 font-medium">Cantidad</th>
          <th scope="col" className="py-2 font-medium">Precio por unidad</th>
        </tr>
      </thead>
      <tbody>
        {escalas.map((e) => (
          <tr key={e.cantidadMinima} className="border-b border-borde-sutil">
            <td className="py-3">{`Desde ${e.cantidadMinima} unidades`}</td>
            <td className="py-3 font-semibold precio">{`${formatearPesos(e.precioUnitario)} c/u`}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
