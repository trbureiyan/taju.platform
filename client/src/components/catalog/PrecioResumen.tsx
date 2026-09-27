import { partesPrecio, formatearPesos } from '../../lib/precio'
import type { Precio } from '../../types'

/**
 * Precio corto para tarjeta y barra móvil, distinto por audiencia: unidad, escala (con "Por volumen") o a cotizar.
 * @prop precio - Precio del producto.
 */
export function PrecioResumen({ precio }: { precio: Precio }) {
  const partes = partesPrecio(precio)

  if (partes.tipo === 'consultar')
    return <p className="text-sm text-texto-secundario">Te lo cotizamos</p>

  if (partes.tipo === 'unidad')
    return (
      <p className="font-semibold text-texto-principal precio">{formatearPesos(partes.valor)}</p>
    )

  return (
    <div className="flex flex-wrap items-center gap-2">
      <p className="text-sm font-semibold text-texto-principal precio">
        {`${formatearPesos(partes.valor)} c/u · desde ${partes.minimo} unidades`}
      </p>
      {/* turquesa suave: es dato de contexto para el cliente profesional, no una accion */}
      <span className="text-xs font-medium text-contexto-texto bg-contexto-suave px-2 py-1 rounded-full">
        Por volumen
      </span>
    </div>
  )
}
