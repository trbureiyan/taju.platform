import { FLUJO_PEDIDO, ETIQUETAS_ESTADO, type EstadoPedido, type HistorialEstadoPedido } from '../../types'
import { avance, SIGUIENTE_PASO } from '../../lib/pedido'

function fechaEnPalabras(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', timeZone: 'America/Bogota' })
}

/**
 * Línea de tiempo vertical: cumplidos con su fecha, el actual con su mensaje, futuros en trazo punteado.
 * Un pedido cancelado se detiene donde estaba y cierra con "Cancelado": no muestra pasos futuros.
 * @prop estadoActual - Estado presente del pedido.
 * @prop historialEstados - Historial sin `actor`, ya proyectado por el server.
 */
export function LineaTiempoPedido({
  estadoActual,
  historialEstados,
}: {
  estadoActual: EstadoPedido
  historialEstados: HistorialEstadoPedido[]
}) {
  const cancelado = estadoActual === 'cancelado'
  const entradaCancelado = historialEstados.find((h) => h.estadoNuevo === 'cancelado')
  const indiceActual = cancelado ? avance(entradaCancelado?.estadoAnterior ?? 'recibido') : avance(estadoActual)
  const pasos = cancelado ? FLUJO_PEDIDO.slice(0, indiceActual + 1) : FLUJO_PEDIDO

  return (
    <ol className="flex flex-col gap-6" aria-label="Historial del pedido">
      {pasos.map((estado, i) => {
        const cumplido = cancelado || i < indiceActual
        const actual = !cancelado && i === indiceActual
        const entrada = historialEstados.find((h) => h.estadoNuevo === estado)

        return (
          <li key={estado} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span
                aria-hidden="true"
                className={[
                  'w-3 h-3 rounded-full shrink-0',
                  cumplido || actual ? 'bg-accion' : 'border-2 border-dashed border-borde-medio bg-transparent',
                ].join(' ')}
              />
              {(i < pasos.length - 1 || cancelado) && (
                <span
                  aria-hidden="true"
                  className={['w-px flex-1 mt-1', cumplido ? 'bg-accion' : 'border-l-2 border-dashed border-borde-medio'].join(
                    ' ',
                  )}
                />
              )}
            </div>
            <div className="pb-2">
              <p className={['font-medium', actual ? 'text-texto-principal' : cumplido ? 'text-texto-secundario' : 'text-texto-tenue'].join(' ')}>
                {ETIQUETAS_ESTADO[estado]}
                {(cumplido || actual) && entrada && `, ${fechaEnPalabras(entrada.fecha)}`}
              </p>
              {actual && <p className="text-sm text-texto-secundario mt-1">{SIGUIENTE_PASO[estado]}</p>}
            </div>
          </li>
        )
      })}

      {cancelado && (
        <li className="flex gap-4">
          <div className="flex flex-col items-center">
            <span aria-hidden="true" className="w-3 h-3 rounded-full shrink-0 bg-texto-tenue" />
          </div>
          <div className="pb-2">
            <p className="font-medium text-texto-principal">
              {ETIQUETAS_ESTADO.cancelado}
              {entradaCancelado && `, ${fechaEnPalabras(entradaCancelado.fecha)}`}
            </p>
            <p className="text-sm text-texto-secundario mt-1">{SIGUIENTE_PASO.cancelado}</p>
          </div>
        </li>
      )}
    </ol>
  )
}
