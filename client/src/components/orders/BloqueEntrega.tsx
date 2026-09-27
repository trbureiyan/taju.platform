/**
 * Bloque de entrega del detalle de pedido. No distingue fecha pedida de confirmada: el formulario guarda
 * la del cliente en `fechaEntrega` y el taller la sobrescribe en el mismo campo (ver spec §4), así que el
 * texto nunca afirma una confirmación que el dato no garantiza.
 * @prop fechaEntrega - Fecha de entrega del pedido, o null si aún no se fijó.
 */
export function BloqueEntrega({ fechaEntrega }: { fechaEntrega: string | null }) {
  return (
    <div className="rounded-tarjeta border border-borde-sutil bg-superficie-hundida p-4">
      {fechaEntrega ? (
        <p className="text-sm font-medium text-texto-principal">
          Entrega prevista:{' '}
          {new Date(fechaEntrega).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      ) : (
        <p className="text-sm text-texto-secundario">
          Te confirmamos la fecha por WhatsApp apenas pase a producción.
        </p>
      )}
    </div>
  )
}
