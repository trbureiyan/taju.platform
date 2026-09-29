import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api, ErrorApi } from '../../lib/api'
import type { EstadoPedido, Pedido } from '../../types'
import { BotonWhatsApp } from '../shared/BotonWhatsApp'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'
import { useSnackbar } from '../ui/Snackbar'

// mismos estilos de Button variante="primario" tamano="lg" - Link no puede ser un <button>, así que se replican aquí
const ESTILO_PEDIR_DE_NUEVO = [
  'inline-flex items-center justify-center gap-2 rounded-boton font-medium min-h-boton px-6 py-3',
  'bg-accion text-accion-texto hover:bg-accion-hover active:bg-accion-activo',
  'transition-[background-color,transform] duration-normal ease-estandar active:scale-97',
  'focus-visible:outline-none focus-visible:shadow-foco',
].join(' ')

// espejo de ESTADOS_CANCELABLES_POR_CLIENTE del server: despues de confirmar, cambiar o cancelar se habla por WhatsApp
const PUEDE_CANCELAR: readonly EstadoPedido[] = ['recibido', 'en_revision']

const ERROR_CANCELAR = 'No pudimos cancelar tu solicitud. Prueba de nuevo o escríbenos por WhatsApp.'

/**
 * Acciones del detalle de pedido: "Pedir de nuevo" (primaria), "Escríbenos por este pedido" y, mientras el
 * taller no confirma, "Cancelar mi solicitud". En móvil se repiten en una barra fija con un solo botón amarillo.
 * @prop productoId - Producto sobre el que se pide de nuevo.
 * @prop pedidoId - Pedido de origen, viaja como `?desde=` (nunca por `location.state`).
 * @prop nombreProducto - Para el mensaje de WhatsApp.
 * @prop codigo - Código del pedido (`codigoPedido()`), para que el taller lo identifique de inmediato.
 * @prop estado - Estado actual; decide si se ofrece cancelar.
 * @prop onCancelado - Recibe el pedido ya cancelado que devolvió el server.
 * @prop onRechazado - Se llama cuando el server rechaza con 409: el estado que vio el cliente ya no es el real.
 */
export function AccionesPedido({
  productoId,
  pedidoId,
  nombreProducto,
  codigo,
  estado,
  onCancelado,
  onRechazado,
}: {
  productoId: string
  pedidoId: string
  nombreProducto: string
  codigo: string
  estado: EstadoPedido
  onCancelado: (pedido: Pedido) => void
  onRechazado: () => void
}) {
  const rutaPedirDeNuevo = `/pedido/${productoId}?desde=${pedidoId}`
  const mensajeWhatsApp = `Hola, les escribo por mi pedido ${codigo} (${nombreProducto}).`
  const puedeCancelar = PUEDE_CANCELAR.includes(estado)
  const [confirmando, setConfirmando] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const { avisar } = useSnackbar()

  async function cancelar() {
    setCancelando(true)
    try {
      const actualizado = await api.patch<Pedido>(`/pedidos/${pedidoId}/cancelar`, {})
      setConfirmando(false)
      avisar('Cancelamos tu solicitud. Si fue un error, escríbenos por WhatsApp.')
      onCancelado(actualizado)
    } catch (err) {
      setConfirmando(false)
      // solo el 409 trae texto pensado para el cliente; cualquier otro fallo (red, 500) no se muestra crudo
      const rechazado = err instanceof ErrorApi && err.estado === 409
      avisar(rechazado ? err.message : ERROR_CANCELAR, { tono: 'error' })
      if (rechazado) onRechazado()
    } finally {
      setCancelando(false)
    }
  }

  return (
    <>
      <div className="hidden lg:flex items-center gap-4">
        <Link to={rutaPedirDeNuevo} className={ESTILO_PEDIR_DE_NUEVO}>
          Pedir de nuevo
        </Link>
        <BotonWhatsApp mensaje={mensajeWhatsApp}>Escríbenos por este pedido</BotonWhatsApp>
        {puedeCancelar && (
          <Button variante="fantasma" onClick={() => setConfirmando(true)}>
            Cancelar mi solicitud
          </Button>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-encabezado bg-superficie-base border-t border-borde-sutil px-4 py-3 flex flex-col gap-2 lg:hidden">
        <Link to={rutaPedirDeNuevo} className={[ESTILO_PEDIR_DE_NUEVO, 'w-full'].join(' ')}>
          Pedir de nuevo
        </Link>
        <div className="text-center">
          <BotonWhatsApp mensaje={mensajeWhatsApp}>Escríbenos por este pedido</BotonWhatsApp>
        </div>
        {puedeCancelar && (
          <Button variante="fantasma" tamano="sm" onClick={() => setConfirmando(true)}>
            Cancelar mi solicitud
          </Button>
        )}
      </div>

      <Dialog abierto={confirmando} titulo="¿Cancelar tu solicitud?" onCerrar={() => !cancelando && setConfirmando(false)}>
        <p className="text-sm text-texto-secundario">
          Dejamos de trabajar en ella. No se puede deshacer, pero puedes volver a pedir cuando quieras.
        </p>
        <div className="flex justify-end gap-2">
          <Button variante="fantasma" disabled={cancelando} onClick={() => setConfirmando(false)}>
            Mantener mi solicitud
          </Button>
          <Button cargando={cancelando} onClick={cancelar}>
            Sí, cancelar mi solicitud
          </Button>
        </div>
      </Dialog>
    </>
  )
}
