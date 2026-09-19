import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import type { Pedido } from '../types'
import { ETIQUETAS_ESTADO, CLASES_ESTADO } from '../types'

export function MisPedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .get<Pedido[]>('/pedidos/mis-pedidos')
      .then(setPedidos)
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar pedidos'))
      .finally(() => setCargando(false))
  }, [])

  return (
    <section>
      <h1 className="text-h2 font-semibold text-texto-principal mb-6">Mis pedidos</h1>

      {/* mismo patron cargando/error/vacio/lista que CatalogoPage */}
      {cargando && <p className="text-texto-secundario">Cargando tus pedidos…</p>}

      {error && (
        <div role="alert" className="rounded-tarjeta border border-error-borde bg-error-fondo p-4">
          <p className="text-sm text-error-texto">{error}</p>
        </div>
      )}

      {!cargando && !error && pedidos.length === 0 && (
        <div className="text-center py-12 flex flex-col gap-4">
          <p className="text-texto-secundario">Aún no tenés pedidos.</p>
          <Link
            to="/catalogo"
            className="text-sm font-medium text-accion hover:underline"
          >
            Explorar el catálogo
          </Link>
        </div>
      )}

      {!cargando && !error && pedidos.length > 0 && (
        <ul className="flex flex-col gap-4" aria-label="Lista de pedidos">
          {pedidos.map((pedido) => (
            <li
              key={pedido._id}
              className="rounded-tarjeta border border-borde-sutil bg-superficie-base shadow-tarjeta p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-col gap-1">
                <p className="font-medium text-texto-principal">
                  {pedido.categoria.nombre}
                </p>
                {/* recorte visual nada mas, el detalle completo esta guardado igual en el pedido */}
                <p className="text-sm text-texto-secundario">
                  {pedido.descripcion.length > 80
                    ? pedido.descripcion.slice(0, 80) + '…'
                    : pedido.descripcion}
                </p>
                <p className="text-xs text-texto-tenue">
                  {pedido.cantidad} unidad{pedido.cantidad !== 1 ? 'es' : ''} ·{' '}
                  {pedido.dimensiones.valor} {pedido.dimensiones.unidad}
                  {pedido.dimensiones.esDimensionPersonalizada ? ' (personalizada)' : ''} ·{' '}
                  Solicitado{' '}
                  {new Date(pedido.fechaSolicitud).toLocaleDateString('es-CO', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
                {pedido.fechaEntrega && (
                  <p className="text-xs font-medium text-exito-texto">
                    Entrega estimada:{' '}
                    {new Date(pedido.fechaEntrega).toLocaleDateString('es-CO', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </p>
                )}
              </div>

              <div className="shrink-0">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${CLASES_ESTADO[pedido.estado]}`}
                >
                  {ETIQUETAS_ESTADO[pedido.estado]}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
