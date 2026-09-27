import type { Precio } from '../../types'
import { Button } from '../ui/Button'
import { PrecioResumen } from '../catalog/PrecioResumen'

/**
 * Barra fija inferior en teléfono: precio y acción siempre al alcance del pulgar (Fitts).
 * @prop precio - Precio del producto.
 * @prop alPedir - Misma acción que el botón principal.
 */
export function BarraPedidoMovil({ precio, alPedir }: { precio: Precio; alPedir: () => void }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-encabezado bg-superficie-base border-t border-borde-sutil px-4 py-3 lg:hidden">
      <div className="flex items-center justify-between gap-4">
        <PrecioResumen precio={precio} />
        <Button onClick={alPedir}>Empezar mi pedido</Button>
      </div>
    </div>
  )
}
