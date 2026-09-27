import { ESTADOS_PEDIDO, type EstadoPedido } from '../../types'
import { avance } from '../../lib/pedido'

/**
 * Línea de seis tramos que muestra cuánto avanzó el pedido. Atenuada cuando ya se entregó.
 * @prop estado - Estado actual del pedido.
 * @prop atenuada - true en pedidos entregados: el avance completo se ve, pero sin llamar la atención.
 */
export function LineaAvance({ estado, atenuada = false }: { estado: EstadoPedido; atenuada?: boolean }) {
  const indiceActual = avance(estado)
  return (
    <ol className="flex gap-1" aria-label={`Avance del pedido: ${indiceActual + 1} de ${ESTADOS_PEDIDO.length}`}>
      {ESTADOS_PEDIDO.map((_, i) => (
        <li
          key={i}
          aria-hidden="true"
          className={[
            'h-1 flex-1 rounded-full transition-colors duration-normal ease-estandar',
            i <= indiceActual ? (atenuada ? 'bg-texto-tenue' : 'bg-accion') : 'bg-borde-sutil',
          ].join(' ')}
        />
      ))}
    </ol>
  )
}
