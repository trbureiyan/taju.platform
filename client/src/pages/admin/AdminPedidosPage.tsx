import { useEffect, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { api } from '../../lib/api'
import type { PedidoAdmin } from '../../types'
import { CLASES_ESTADO, ETIQUETAS_ESTADO, ETIQUETAS_MEDIO_PAGO } from '../../types'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { useSnackbar } from '../../components/ui/Snackbar'
import { AcuerdoDialog } from '../../components/admin/AcuerdoDialog'
import { codigoPedido, fechaConHora } from '../../lib/pedido'
import { enlaceWhatsAppA } from '../../lib/whatsapp'
import { mensajeAlCliente } from '../../lib/mensajePedido'
import { limiteDeContacto } from '../../lib/horario'
import {
  SIGUIENTE_ESTADO,
  estaSinContactar,
  estaVencida,
  faltantesParaAvanzar,
  mensajeDeError,
  promesaVencida,
  requiereConfirmacionDimension,
  sePuedeCancelar,
  textoEntrega,
} from '../../lib/pedidoAdmin'

type Filtro = 'todos' | 'sin-contactar' | 'vencidas'
type Confirmacion = { tipo: 'avanzar' | 'cancelar'; pedido: PedidoAdmin }

const ERROR_CARGA = 'No pudimos cargar los pedidos. Recarga la página para intentar de nuevo.'
const ERROR_ACCION = 'No pudimos actualizar el pedido. Prueba de nuevo.'

const AVISO_EN_CURSO = 'Estamos guardando otro cambio. Espera un momento y vuelve a intentarlo.'

export function AdminPedidosPage() {
  const [pedidos, setPedidos] = useState<PedidoAdmin[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // id de la fila en vuelo - deshabilita sus botones sin tocar el resto de la tabla y evita el doble clic
  const [actualizando, setActualizando] = useState<string | null>(null)
  const [acuerdoDe, setAcuerdoDe] = useState<PedidoAdmin | null>(null)
  const [confirmacion, setConfirmacion] = useState<Confirmacion | null>(null)
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const { avisar } = useSnackbar()

  useEffect(() => {
    api
      .get<PedidoAdmin[]>('/pedidos')
      .then(setPedidos)
      .catch(() => setError(ERROR_CARGA))
      .finally(() => setCargando(false))
  }, [])

  function reemplazarFila(actualizado: PedidoAdmin) {
    setPedidos((prev) => prev.map((p) => (p._id === actualizado._id ? actualizado : p)))
  }

  // las tres acciones de una fila comparten el mismo ciclo: en vuelo, reemplazar la fila con la respuesta del
  // server (no un refetch completo), avisar en un snackbar y explicar el motivo si el server rechaza
  async function ejecutar(id: string, accion: () => Promise<PedidoAdmin>, exito: string) {
    if (actualizando) {
      avisar(AVISO_EN_CURSO, { tono: 'error' })
      return
    }
    setActualizando(id)
    try {
      reemplazarFila(await accion())
      avisar(exito)
    } catch (err) {
      avisar(mensajeDeError(err, ERROR_ACCION), { tono: 'error' })
    } finally {
      setActualizando(null)
    }
  }

  function marcarContacto(p: PedidoAdmin) {
    return ejecutar(
      p._id,
      () => api.post<PedidoAdmin>(`/pedidos/${p._id}/contacto`, {}),
      `${codigoPedido(p._id)} marcado como contactado.`,
    )
  }

  function confirmar() {
    if (!confirmacion) return
    const { tipo, pedido } = confirmacion
    setConfirmacion(null)
    if (tipo === 'cancelar') {
      return ejecutar(
        pedido._id,
        () => api.patch<PedidoAdmin>(`/pedidos/${pedido._id}/estado`, { estado: 'cancelado' }),
        `${codigoPedido(pedido._id)} cancelado.`,
      )
    }
    const siguiente = SIGUIENTE_ESTADO[pedido.estado]
    if (!siguiente) return
    return ejecutar(
      pedido._id,
      () =>
        api.patch<PedidoAdmin>(`/pedidos/${pedido._id}/estado`, {
          estado: siguiente,
          confirmarDimensionPersonalizada: requiereConfirmacionDimension(pedido, siguiente),
        }),
      `${codigoPedido(pedido._id)} pasó a "${ETIQUETAS_ESTADO[siguiente].toLowerCase()}".`,
    )
  }

  const ahora = new Date()
  const nSinContactar = pedidos.filter(estaSinContactar).length
  const nVencidas = pedidos.filter((p) => estaVencida(p, ahora)).length
  const visibles = pedidos.filter(
    (p) => filtro === 'todos' || (filtro === 'sin-contactar' ? estaSinContactar(p) : estaVencida(p, ahora)),
  )
  const filtros: { valor: Filtro; texto: string }[] = [
    { valor: 'todos', texto: 'Todos' },
    { valor: 'sin-contactar', texto: `Sin contactar (${nSinContactar})` },
    { valor: 'vencidas', texto: `Vencidas (${nVencidas})` },
  ]

  const siguienteDeConfirmacion = confirmacion ? SIGUIENTE_ESTADO[confirmacion.pedido.estado] : undefined
  const pideDimension =
    confirmacion?.tipo === 'avanzar' && siguienteDeConfirmacion
      ? requiereConfirmacionDimension(confirmacion.pedido, siguienteDeConfirmacion)
      : false

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
        <>
          <div role="group" aria-label="Filtrar pedidos" className="mb-4 flex flex-wrap gap-2">
            {filtros.map((f) => (
              <Button
                key={f.valor}
                variante={filtro === f.valor ? 'secundario' : 'fantasma'}
                tamano="sm"
                aria-pressed={filtro === f.valor}
                onClick={() => setFiltro(f.valor)}
              >
                {f.texto}
              </Button>
            ))}
          </div>

          {visibles.length === 0 && (
            <p className="text-texto-secundario">Ningún pedido en este filtro.</p>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Pedidos">
              <thead>
                <tr className="border-b border-borde-medio">
                  <th className="text-left py-3 pr-4 font-medium text-texto-secundario">Código</th>
                  <th className="text-left py-3 pr-4 font-medium text-texto-secundario">Cliente</th>
                  <th className="text-left py-3 pr-4 font-medium text-texto-secundario">Producto</th>
                  <th className="text-left py-3 pr-4 font-medium text-texto-secundario">Categoría</th>
                  <th className="text-left py-3 pr-4 font-medium text-texto-secundario">Descripción</th>
                  <th className="text-left py-3 pr-4 font-medium text-texto-secundario">Dimensión</th>
                  <th className="text-left py-3 pr-4 font-medium text-texto-secundario">Cant.</th>
                  <th className="text-left py-3 pr-4 font-medium text-texto-secundario">Fecha</th>
                  <th className="text-left py-3 pr-4 font-medium text-texto-secundario">Acuerdo</th>
                  <th className="text-left py-3 pr-4 font-medium text-texto-secundario">Estado</th>
                  <th className="text-left py-3 font-medium text-texto-secundario">Acción</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((pedido) => {
                  const siguiente = SIGUIENTE_ESTADO[pedido.estado]
                  const faltan = siguiente ? faltantesParaAvanzar(pedido, siguiente) : []
                  const ocupado = actualizando === pedido._id
                  const cerrado = pedido.estado === 'entregado' || pedido.estado === 'cancelado'
                  const sinContactar = estaSinContactar(pedido)
                  const idFaltan = `faltan-${pedido._id}`
                  return (
                    <tr
                      key={pedido._id}
                      className="border-b border-borde-sutil hover:bg-superficie-hundida transition-colors align-top"
                    >
                      <td className="py-3 pr-4 font-mono text-xs text-texto-secundario">
                        {codigoPedido(pedido._id)}
                      </td>
                      <td className="py-3 pr-4 text-texto-principal">
                        <p>{pedido.contacto.nombre}</p>
                        <a
                          href={enlaceWhatsAppA(pedido.contacto.telefono, mensajeAlCliente(pedido))}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Escribir por WhatsApp a ${pedido.contacto.nombre}`}
                          className="inline-flex min-h-boton items-center gap-1 rounded-boton text-xs text-texto-secundario underline underline-offset-4 tabular-nums outline-none focus-visible:shadow-foco"
                        >
                          <MessageCircle aria-hidden="true" size={14} />
                          {pedido.contacto.telefono}
                        </a>
                        {sinContactar && (
                          <p
                            className={[
                              'text-xs mt-1',
                              promesaVencida(pedido, ahora) ? 'text-error-texto' : 'text-texto-tenue',
                            ].join(' ')}
                          >
                            Contactar antes de {fechaConHora(limiteDeContacto(new Date(pedido.fechaSolicitud)).toISOString())}
                          </p>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-texto-principal">{pedido.producto.nombre}</td>
                      <td className="py-3 pr-4 text-texto-principal">{pedido.categoria.nombre}</td>
                      <td className="py-3 pr-4 text-texto-secundario max-w-[200px] truncate">{pedido.descripcion}</td>
                      <td className="py-3 pr-4 text-texto-secundario whitespace-nowrap tabular-nums">
                        {pedido.dimensiones.valor} cm
                        {pedido.dimensiones.esDimensionPersonalizada && (
                          <span className="ml-1 text-xs text-texto-tenue">(personalizada)</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-texto-principal tabular-nums">{pedido.cantidad}</td>
                      <td className="py-3 pr-4 text-texto-tenue whitespace-nowrap">
                        {new Date(pedido.fechaSolicitud).toLocaleDateString('es-CO', {
                          day: 'numeric',
                          month: 'short',
                          timeZone: 'America/Bogota',
                        })}
                      </td>
                      <td className="py-3 pr-4 text-xs text-texto-secundario">
                        <p>Deseada: {pedido.fechaDeseada ? fechaConHora(pedido.fechaDeseada) : 'sin fecha'}</p>
                        <p>Acordada: {pedido.fechaEntrega ? fechaConHora(pedido.fechaEntrega) : 'pendiente'}</p>
                        <p>Entrega: {textoEntrega(pedido)}</p>
                        <p className="tabular-nums">
                          Anticipo:{' '}
                          {pedido.pago
                            ? `$${pedido.pago.monto.toLocaleString('es-CO')} (${ETIQUETAS_MEDIO_PAGO[pedido.pago.medio]})`
                            : 'pendiente'}
                        </p>
                        {!cerrado && (
                          <Button variante="fantasma" tamano="sm" onClick={() => setAcuerdoDe(pedido)}>
                            Registrar acuerdo
                          </Button>
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
                        <div className="flex flex-col items-start gap-2">
                          {sinContactar && (
                            <Button
                              variante="secundario"
                              tamano="sm"
                              disabled={ocupado}
                              onClick={() => marcarContacto(pedido)}
                            >
                              Ya le escribí
                            </Button>
                          )}
                          {siguiente ? (
                            <>
                              <Button
                                variante="secundario"
                                tamano="sm"
                                disabled={ocupado || faltan.length > 0}
                                aria-describedby={faltan.length > 0 ? idFaltan : undefined}
                                onClick={() => setConfirmacion({ tipo: 'avanzar', pedido })}
                              >
                                {ocupado ? 'Actualizando…' : `→ ${ETIQUETAS_ESTADO[siguiente]}`}
                              </Button>
                              {faltan.length > 0 && (
                                <span id={idFaltan} className="text-xs text-texto-tenue">
                                  Falta: {faltan.join(', ')}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-texto-tenue">
                              {pedido.estado === 'cancelado' ? 'Cancelado' : 'Completado'}
                            </span>
                          )}
                          {sePuedeCancelar(pedido.estado) && (
                            <Button
                              variante="fantasma"
                              tamano="sm"
                              disabled={ocupado}
                              onClick={() => setConfirmacion({ tipo: 'cancelar', pedido })}
                            >
                              Cancelar pedido
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <AcuerdoDialog pedido={acuerdoDe} onCerrar={() => setAcuerdoDe(null)} onGuardado={reemplazarFila} />

      <Dialog
        abierto={confirmacion !== null}
        titulo={
          confirmacion?.tipo === 'cancelar'
            ? `Cancelar ${codigoPedido(confirmacion.pedido._id)}`
            : confirmacion && siguienteDeConfirmacion
              ? `Pasar ${codigoPedido(confirmacion.pedido._id)} a "${ETIQUETAS_ESTADO[siguienteDeConfirmacion]}"`
              : ''
        }
        onCerrar={() => setConfirmacion(null)}
      >
        <p className="text-sm text-texto-secundario">
          {confirmacion?.tipo === 'cancelar'
            ? 'El cliente lo verá como cancelado. No se puede deshacer.'
            : pideDimension
              ? 'Este pedido tiene una medida personalizada. Confirma que ya la revisaste. No se puede deshacer.'
              : 'No se puede deshacer.'}
        </p>
        <div className="flex justify-end gap-2">
          <Button type="button" variante="fantasma" onClick={() => setConfirmacion(null)}>
            Volver
          </Button>
          <Button type="button" onClick={confirmar}>
            {confirmacion?.tipo === 'cancelar'
              ? 'Cancelar pedido'
              : siguienteDeConfirmacion
                ? `Pasar a "${ETIQUETAS_ESTADO[siguienteDeConfirmacion]}"`
                : 'Confirmar'}
          </Button>
        </div>
      </Dialog>
    </section>
  )
}
