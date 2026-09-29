import type { EstadoPedido, Pedido } from '../../types'
import { fechaConHora } from '../../lib/pedido'

/**
 * Bloque de entrega del detalle de pedido. Distingue lo que el cliente pidió de lo que se acordó:
 * la fecha acordada solo existe cuando el taller la registra, así que el texto nunca afirma un acuerdo
 * que el dato no garantiza.
 * @prop estado - Estado del pedido; uno cancelado no muestra fechas ni promete acordarlas.
 * @prop fechaDeseada - Lo que pidió el cliente, o null.
 * @prop fechaEntrega - La fecha acordada con el taller, o null mientras no se acuerde.
 * @prop entrega - Cómo recibe el pedido: taller o domicilio con su dirección.
 */
export function BloqueEntrega({
  estado,
  fechaDeseada,
  fechaEntrega,
  entrega,
}: {
  estado: EstadoPedido
  fechaDeseada: string | null
  fechaEntrega: string | null
  entrega: Pedido['entrega']
}) {
  const modo =
    entrega.metodo === 'domicilio'
      ? `A domicilio${entrega.detalle ? `: ${entrega.detalle}` : ''}`
      : 'La recoges en el taller'

  if (estado === 'cancelado') return null

  return (
    <div className="rounded-tarjeta border border-borde-sutil bg-superficie-hundida p-4 flex flex-col gap-1">
      {fechaEntrega ? (
        <p className="text-sm font-medium text-texto-principal">Fecha acordada: {fechaConHora(fechaEntrega)}</p>
      ) : (
        <>
          {fechaDeseada && (
            <p className="text-sm text-texto-principal">Fecha que pediste: {fechaConHora(fechaDeseada)}</p>
          )}
          <p className="text-sm text-texto-secundario">La acordamos contigo por WhatsApp antes de confirmar.</p>
        </>
      )}
      <p className="text-sm text-texto-secundario">{modo}</p>
    </div>
  )
}
