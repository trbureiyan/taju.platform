import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import type { PedidoAdmin } from '../../types'
import { ETIQUETAS_ESTADO, CLASES_ESTADO } from '../../types'

// ─── Agrupacion por semana ────────────────────────────────────────────────────

// lunes de la semana ISO de esa fecha - getDay() da domingo=0, por eso el caso especial
function inicioSemana(fecha: Date): Date {
  const d = new Date(fecha)
  const dia = d.getDay()
  const diff = dia === 0 ? -6 : 1 - dia
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

// lunes a viernes fijo - el taller no produce ni entrega fin de semana, por eso el rango siempre es de 5 dias
function etiquetaSemana(lunes: Date): string {
  const viernes = new Date(lunes)
  viernes.setDate(lunes.getDate() + 4)
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
  return `${lunes.toLocaleDateString('es-CO', opts)} – ${viernes.toLocaleDateString('es-CO', opts)}`
}

type Grupos = {
  [semanaISO: string]: { etiqueta: string; pedidos: PedidoAdmin[] }
}

// ─── Pagina ───────────────────────────────────────────────────────────────────

export function AdminCalendarioPage() {
  const [pedidos, setPedidos] = useState<PedidoAdmin[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .get<PedidoAdmin[]>('/pedidos')
      .then(setPedidos)
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar pedidos'))
      .finally(() => setCargando(false))
  }, [])

  // entregados ya no compiten por espacio en el calendario, el taller mira para adelante
  const activos = pedidos.filter((p) => p.estado !== 'entregado')

  // agrupa por semana de lunes (ISO string como key ordena cronologico gratis) y separa los sin fecha aparte
  const { grupos, sinFecha } = activos.reduce<{
    grupos: Grupos
    sinFecha: PedidoAdmin[]
  }>(
    (acc, p) => {
      if (!p.fechaEstimadaEntrega) {
        acc.sinFecha.push(p)
        return acc
      }
      const lunes = inicioSemana(new Date(p.fechaEstimadaEntrega))
      const key = lunes.toISOString().slice(0, 10)
      if (!acc.grupos[key]) {
        acc.grupos[key] = { etiqueta: etiquetaSemana(lunes), pedidos: [] }
      }
      acc.grupos[key].pedidos.push(p)
      return acc
    },
    { grupos: {}, sinFecha: [] },
  )

  const semanasOrdenadas = Object.keys(grupos).sort() // ordena por string ISO, que ya es orden cronologico

  return (
    <section>
      <h1 className="text-h2 font-semibold text-texto-principal mb-6">Calendario de entregas</h1>

      {cargando && <p className="text-texto-secundario">Cargando pedidos…</p>}

      {error && (
        <div role="alert" className="rounded-tarjeta border border-error-borde bg-error-fondo p-4 mb-4">
          <p className="text-sm text-error-texto">{error}</p>
        </div>
      )}

      {!cargando && !error && activos.length === 0 && (
        <p className="text-texto-secundario">No hay pedidos activos.</p>
      )}

      {!cargando && !error && activos.length > 0 && (
        <div className="flex flex-col gap-8">
          {semanasOrdenadas.map((key) => {
            const { etiqueta, pedidos: semPedidos } = grupos[key]
            return (
              <div key={key}>
                <h2 className="text-sm font-semibold text-texto-secundario mb-3 uppercase tracking-wide">
                  Semana del {etiqueta}
                </h2>
                <ul className="flex flex-col gap-3">
                  {semPedidos.map((p) => (
                    <PedidoCard key={p._id} pedido={p} />
                  ))}
                </ul>
              </div>
            )
          })}

          {sinFecha.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-texto-secundario mb-3 uppercase tracking-wide">
                Sin fecha asignada
              </h2>
              <ul className="flex flex-col gap-3">
                {sinFecha.map((p) => (
                  <PedidoCard key={p._id} pedido={p} />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

// ─── Tarjeta de pedido ─────────────────────────────────────────────────────────
// mismo recorte de descripcion a 60 caracteres que MisPedidosPage hace a 80 - la vista de calendario
// tiene menos espacio horizontal disponible por tarjeta, de ahi el numero mas chico
function PedidoCard({ pedido }: { pedido: PedidoAdmin }) {
  return (
    <li className="rounded-tarjeta border border-borde-sutil bg-superficie-base shadow-tarjeta p-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-0.5">
        <p className="font-medium text-texto-principal text-sm">{pedido.cliente.email}</p>
        <p className="text-xs text-texto-secundario">
          {pedido.categoria.nombre} · {pedido.cantidad} u · {pedido.dimensiones.valor} cm
        </p>
        <p className="text-xs text-texto-tenue truncate max-w-xs">
          {pedido.descripcion.length > 60
            ? pedido.descripcion.slice(0, 60) + '…'
            : pedido.descripcion}
        </p>
      </div>
      <span
        className={`inline-block shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${CLASES_ESTADO[pedido.estado]}`}
      >
        {ETIQUETAS_ESTADO[pedido.estado]}
      </span>
    </li>
  )
}
