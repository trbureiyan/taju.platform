import { Link } from 'react-router-dom'
import { BotonWhatsApp } from '../shared/BotonWhatsApp'

// mismos estilos de Button variante="primario" tamano="lg" - Link no puede ser un <button>, así que se replican aquí
const ESTILO_PEDIR_DE_NUEVO = [
  'inline-flex items-center justify-center gap-2 rounded-boton font-medium min-h-boton px-6 py-3',
  'bg-accion text-accion-texto hover:bg-accion-hover active:bg-accion-activo',
  'transition-[background-color,transform] duration-normal ease-estandar active:scale-97',
  'focus-visible:outline-none focus-visible:shadow-foco',
].join(' ')

/**
 * Acciones del detalle de pedido: "Pedir de nuevo" (primaria) y "Escríbenos por este pedido" (secundaria).
 * En móvil ambas se repiten en una barra fija con un solo botón amarillo, como `BarraPedidoMovil`.
 * @prop productoId - Producto sobre el que se pide de nuevo.
 * @prop pedidoId - Pedido de origen, viaja como `?desde=` (nunca por `location.state`).
 * @prop nombreProducto - Para el mensaje de WhatsApp.
 * @prop codigo - Código del pedido (`codigoPedido()`), para que el taller lo identifique de inmediato.
 */
export function AccionesPedido({
  productoId,
  pedidoId,
  nombreProducto,
  codigo,
}: {
  productoId: string
  pedidoId: string
  nombreProducto: string
  codigo: string
}) {
  const rutaPedirDeNuevo = `/pedido/${productoId}?desde=${pedidoId}`
  const mensajeWhatsApp = `Hola, les escribo por mi pedido ${codigo} (${nombreProducto}).`

  return (
    <>
      <div className="hidden lg:flex items-center gap-4">
        <Link to={rutaPedirDeNuevo} className={ESTILO_PEDIR_DE_NUEVO}>
          Pedir de nuevo
        </Link>
        <BotonWhatsApp mensaje={mensajeWhatsApp}>Escríbenos por este pedido</BotonWhatsApp>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-encabezado bg-superficie-base border-t border-borde-sutil px-4 py-3 flex flex-col gap-2 lg:hidden">
        <Link to={rutaPedirDeNuevo} className={[ESTILO_PEDIR_DE_NUEVO, 'w-full'].join(' ')}>
          Pedir de nuevo
        </Link>
        <div className="text-center">
          <BotonWhatsApp mensaje={mensajeWhatsApp}>Escríbenos por este pedido</BotonWhatsApp>
        </div>
      </div>
    </>
  )
}
