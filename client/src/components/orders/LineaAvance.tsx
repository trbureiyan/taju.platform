import { FLUJO_PEDIDO, type EstadoPedido } from '../../types'
import { avance } from '../../lib/pedido'

/**
 * Línea de seis tramos que muestra cuánto avanzó el pedido. Atenuada cuando ya se entregó.
 * Un pedido cancelado no dibuja nada: no avanza, y la etiqueta y el mensaje de la tarjeta ya lo dicen.
 * @prop estado - Estado actual del pedido.
 * @prop atenuada - true en pedidos entregados: el avance completo se ve, pero sin llamar la atención.
 */
export function LineaAvance({ estado, atenuada = false }: { estado: EstadoPedido; atenuada?: boolean }) {
  if (estado === 'cancelado') return null
  const indiceActual = avance(estado)
  return (
    <ol className="flex gap-1" aria-label={`Avance del pedido: ${indiceActual + 1} de ${FLUJO_PEDIDO.length}`}>
      {FLUJO_PEDIDO.map((_, i) => (
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
