import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import type { PedidoAdmin, EstadoPedido } from '../../types'
import { ETIQUETAS_ESTADO, CLASES_ESTADO } from '../../types'
import { Button } from '../../components/ui/Button'

// mapa lineal a proposito - el admin solo puede avanzar un paso, nunca saltar ni retroceder (ver pedidos.service)
const SIGUIENTE_ESTADO: Partial<Record<EstadoPedido, EstadoPedido>> = {
  pendiente: 'en_produccion',
  en_produccion: 'listo',
  listo: 'entregado',
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

  // avanza un solo paso - si SIGUIENTE_ESTADO no tiene entrada (entregado), el boton ni se muestra en el render
  async function avanzarEstado(pedido: PedidoAdmin) {
    const siguiente = SIGUIENTE_ESTADO[pedido.estado]
    if (!siguiente || actualizando) return // actualizando evita doble click mientras la request esta en vuelo

    setActualizando(pedido._id)
    try {
      const actualizado = await api.patch<PedidoAdmin>(`/pedidos/${pedido._id}/estado`, {
        estado: siguiente,
      })
      // reemplaza solo esa fila con la respuesta del server, no un refetch completo de la lista
      setPedidos((prev) => prev.map((p) => (p._id === pedido._id ? actualizado : p)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar estado')
    } finally {
      setActualizando(null)
    }
  }

  // string vacio (input date sin valor) se traduce a null - "sin fecha" es un estado valido, no un error
  async function guardarFechaEntrega(pedidoId: string, isoValue: string) {
    try {
      const fechaEstimadaEntrega = isoValue ? new Date(isoValue).toISOString() : null
      const actualizado = await api.patch<PedidoAdmin>(`/pedidos/${pedidoId}/fecha-entrega`, {
        fechaEstimadaEntrega,
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
                            pedido.fechaEstimadaEntrega
                              ? pedido.fechaEstimadaEntrega.slice(0, 10)
                              : ''
                          }
                          // guarda solo al salir del campo y si de verdad cambio, no en cada tecla
                          onBlur={(e) => {
                            const val = e.currentTarget.value
                            const prev = pedido.fechaEstimadaEntrega
                              ? pedido.fechaEstimadaEntrega.slice(0, 10)
                              : ''
                            if (val !== prev) {
                              setFechaEditando(pedido._id)
                              guardarFechaEntrega(pedido._id, val)
                            }
                          }}
                        />
                      ) : pedido.fechaEstimadaEntrega ? (
                        <span className="text-xs text-texto-tenue">
                          {new Date(pedido.fechaEstimadaEntrega).toLocaleDateString('es-CO', {
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
