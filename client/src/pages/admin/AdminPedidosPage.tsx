import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import type { PedidoAdmin, EstadoPedido } from '../../types'
import { ETIQUETAS_ESTADO, CLASES_ESTADO } from '../../types'
import { Button } from '../../components/ui/Button'

// mapa lineal a proposito - el admin solo puede avanzar un paso, nunca saltar ni retroceder (ver pedidos.service)
const SIGUIENTE_ESTADO: Partial<Record<EstadoPedido, EstadoPedido>> = {
  recibido: 'en_revision',
  en_revision: 'confirmado',
  confirmado: 'en_produccion',
  en_produccion: 'listo_para_entrega',
  listo_para_entrega: 'entregado',
}

export function AdminPedidosPage() {
  const [pedidos, setPedidos] = useState<PedidoAdmin[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // ids de fila en vuelo - guardan que boton/input mostrar como "guardando" sin tocar el resto de la tabla
  const [actualizando, setActualizando] = useState<string | null>(null)
  const [fechaEditando, setFechaEditando] = useState<string | null>(null)

  useEffect(() => {
    api
      .get<PedidoAdmin[]>('/pedidos')
      .then(setPedidos)
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar pedidos'))
      .finally(() => setCargando(false))
  }, [])

  // avanza un solo paso - si SIGUIENTE_ESTADO no tiene entrada (entregado), el boton ni se muestra en el render.
  // es una transicion irreversible (no se puede retroceder, ver pedidos.service) - siempre pide confirmacion
  async function avanzarEstado(pedido: PedidoAdmin) {
    const siguiente = SIGUIENTE_ESTADO[pedido.estado]
    if (!siguiente || actualizando) return // actualizando evita doble click mientras la request esta en vuelo

    // dimension personalizada exige confirmacion explicita antes de pasar a en_produccion (ver pedidos.service)
    const requiereConfirmacionDimension =
      siguiente === 'en_produccion' &&
      pedido.dimensiones.esDimensionPersonalizada &&
      !pedido.confirmacionDimensionPersonalizada

    const mensaje = requiereConfirmacionDimension
      ? `Este pedido tiene una dimensión personalizada. ¿Confirmás que ya la revisaste y pasás el pedido a "${ETIQUETAS_ESTADO[siguiente]}"?`
      : `¿Pasar este pedido a "${ETIQUETAS_ESTADO[siguiente]}"? No se puede deshacer.`
    if (!window.confirm(mensaje)) return

    setActualizando(pedido._id)
    try {
      const actualizado = await api.patch<PedidoAdmin>(`/pedidos/${pedido._id}/estado`, {
        estado: siguiente,
        confirmarDimensionPersonalizada: requiereConfirmacionDimension,
      })
      // reemplaza solo esa fila con la respuesta del server, no un refetch completo de la lista
      setPedidos((prev) => prev.map((p) => (p._id === pedido._id ? actualizado : p)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar estado')
    } finally {
      setActualizando(null)
    }
  }

  // string vacio (input date sin valor) se traduce a null - "sin fecha" es un estado valido, no un error.
  // new Date('YYYY-MM-DD') interpreta el string como medianoche UTC, que en Colombia (UTC-5) ya es el dia
  // anterior - fijar la hora a mediodia local evita que la conversion a UTC cruce a la fecha equivocada
  function fechaLocalSinCorrimiento(isoValue: string): string {
    return new Date(`${isoValue}T12:00:00`).toISOString()
  }

  async function guardarFechaEntrega(pedidoId: string, isoValue: string) {
    try {
      const fechaEntrega = isoValue ? fechaLocalSinCorrimiento(isoValue) : null
      const actualizado = await api.patch<PedidoAdmin>(`/pedidos/${pedidoId}/fecha-entrega`, {
        fechaEntrega,
      })
      setPedidos((prev) => prev.map((p) => (p._id === pedidoId ? actualizado : p)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar fecha')
    } finally {
      setFechaEditando(null)
    }
  }

  return (
    <section>
      <h1 className="text-h2 font-semibold text-texto-principal mb-6">Gestión de pedidos</h1>

      {cargando && <p className="text-texto-secundario">Cargando pedidos…</p>}

      {error && (
        <div role="alert" className="rounded-tarjeta border border-error-borde bg-error-fondo p-4 mb-4">
          <p className="text-sm text-error-texto">{error}</p>
        </div>
      )}

      {!cargando && !error && pedidos.length === 0 && (
        <p className="text-texto-secundario">No hay pedidos registrados aún.</p>
      )}

      {!cargando && pedidos.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Pedidos">
            <thead>
              <tr className="border-b border-borde-medio">
                <th className="text-left py-3 pr-4 font-medium text-texto-secundario">Cliente</th>
                <th className="text-left py-3 pr-4 font-medium text-texto-secundario">Producto</th>
                <th className="text-left py-3 pr-4 font-medium text-texto-secundario">Categoría</th>
                <th className="text-left py-3 pr-4 font-medium text-texto-secundario">Descripción</th>
                <th className="text-left py-3 pr-4 font-medium text-texto-secundario">Dimensión</th>
                <th className="text-left py-3 pr-4 font-medium text-texto-secundario">Cant.</th>
                <th className="text-left py-3 pr-4 font-medium text-texto-secundario">Fecha</th>
                <th className="text-left py-3 pr-4 font-medium text-texto-secundario">Entrega</th>
                <th className="text-left py-3 pr-4 font-medium text-texto-secundario">Estado</th>
                <th className="text-left py-3 font-medium text-texto-secundario">Acción</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((pedido) => {
                const siguiente = SIGUIENTE_ESTADO[pedido.estado]
                return (
                  <tr
                    key={pedido._id}
                    className="border-b border-borde-sutil hover:bg-superficie-hundida transition-colors"
                  >
                    <td className="py-3 pr-4 text-texto-principal">
                      {pedido.cliente.email}
                    </td>
                    <td className="py-3 pr-4 text-texto-principal">
                      {pedido.producto.nombre}
                    </td>
                    <td className="py-3 pr-4 text-texto-principal">
                      {pedido.categoria.nombre}
                    </td>
                    <td className="py-3 pr-4 text-texto-secundario max-w-[200px] truncate">
                      {pedido.descripcion}
                    </td>
                    <td className="py-3 pr-4 text-texto-secundario whitespace-nowrap">
                      {pedido.dimensiones.valor} cm
                      {pedido.dimensiones.esDimensionPersonalizada && (
                        <span className="ml-1 text-xs text-texto-tenue">(personalizada)</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-texto-principal">{pedido.cantidad}</td>
                    <td className="py-3 pr-4 text-texto-tenue whitespace-nowrap">
                      {new Date(pedido.fechaSolicitud).toLocaleDateString('es-CO', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </td>
                    <td className="py-3 pr-4">
                      {pedido.estado !== 'entregado' ? (
                        <input
                          type="date"
                          aria-label="Fecha estimada de entrega"
                          className="rounded-campo border border-campo-borde bg-campo-fondo text-campo-texto text-xs px-2 py-1 focus:outline-none focus:ring-1 focus:ring-accion"
                          defaultValue={
                            pedido.fechaEntrega
                              ? pedido.fechaEntrega.slice(0, 10)
                              : ''
                          }
                          // guarda solo al salir del campo y si de verdad cambio, no en cada tecla
                          onBlur={(e) => {
                            const val = e.currentTarget.value
                            const prev = pedido.fechaEntrega
                              ? pedido.fechaEntrega.slice(0, 10)
                              : ''
                            if (val !== prev) {
                              setFechaEditando(pedido._id)
                              guardarFechaEntrega(pedido._id, val)
                            }
                          }}
                        />
                      ) : pedido.fechaEntrega ? (
                        <span className="text-xs text-texto-tenue">
                          {new Date(pedido.fechaEntrega).toLocaleDateString('es-CO', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      ) : (
                        <span className="text-xs text-texto-tenue">—</span>
                      )}
                      {fechaEditando === pedido._id && (
                        <span className="ml-1 text-xs text-texto-tenue">Guardando…</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${CLASES_ESTADO[pedido.estado]}`}
                      >
                        {ETIQUETAS_ESTADO[pedido.estado]}
                      </span>
                    </td>
                    <td className="py-3">
                      {siguiente ? (
                        <Button
                          variante="secundario"
                          tamano="sm"
                          disabled={actualizando === pedido._id}
                          onClick={() => avanzarEstado(pedido)}
                        >
                          {actualizando === pedido._id
                            ? 'Actualizando…'
                            : `→ ${ETIQUETAS_ESTADO[siguiente]}`}
                        </Button>
                      ) : (
                        <span className="text-xs text-texto-tenue">Completado</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
