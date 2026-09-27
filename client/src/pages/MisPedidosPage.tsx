import { Link } from 'react-router-dom'
import { useMisPedidos } from '../hooks/useMisPedidos'
import { TarjetaPedido } from '../components/orders/TarjetaPedido'
import { EsperaTaller } from '../components/shared/EsperaTaller'
import { Button } from '../components/ui/Button'
import { enCurso } from '../lib/pedido'

export function MisPedidosPage() {
  const { pedidos, cargando, error, reintentar } = useMisPedidos()

  const enCamino = pedidos.filter((p) => enCurso(p.estado))
  const entregados = pedidos.filter((p) => !enCurso(p.estado))

  return (
    <section>
      <h1 className="text-h2 font-semibold text-texto-principal mb-2">Mis pedidos</h1>
      {!cargando && !error && enCamino.length > 0 && (
        <p className="text-texto-secundario mb-6">
          Tienes {enCamino.length} pedido{enCamino.length !== 1 ? 's' : ''} en camino
        </p>
      )}

      {cargando && <EsperaTaller mensaje="Estamos trayendo tus pedidos" />}

      {error && (
        <div role="alert" className="rounded-tarjeta border border-error-borde bg-error-fondo p-4 flex flex-col gap-3 items-start">
          <p className="text-sm text-error-texto">No pudimos traer tus pedidos. Prueba de nuevo en unos segundos.</p>
          <Button variante="secundario" onClick={reintentar}>
            Probar de nuevo
          </Button>
        </div>
      )}

      {!cargando && !error && pedidos.length === 0 && (
        <div className="text-center py-12 flex flex-col gap-4">
          <p className="text-texto-secundario">Aún no tienes pedidos.</p>
          <Link to="/catalogo" className="text-sm font-medium text-texto-principal hover:underline">
            Explorar el catálogo
          </Link>
        </div>
      )}

      {!cargando && !error && pedidos.length > 0 && (
        <div className="flex flex-col gap-8">
          {enCamino.length > 0 && (
            <ul className="flex flex-col gap-4" aria-label="Pedidos en camino">
              {enCamino.map((p) => (
                <li key={p._id}>
                  <TarjetaPedido pedido={p} />
                </li>
              ))}
            </ul>
          )}

          {entregados.length > 0 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-sm font-medium text-texto-secundario uppercase tracking-wide">Entregados</h2>
              <ul className="flex flex-col gap-4" aria-label="Pedidos entregados">
                {entregados.map((p) => (
                  <li key={p._id}>
                    <TarjetaPedido pedido={p} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
