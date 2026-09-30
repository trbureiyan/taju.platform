import { useState, type FormEvent } from 'react'
import { api } from '../../lib/api'
import type { MedioPago, MetodoEntrega, PedidoAdmin } from '../../types'
import { ETIQUETAS_MEDIO_PAGO, MEDIOS_PAGO } from '../../types'
import { codigoPedido, fechaConHora } from '../../lib/pedido'
import { isoDesdePartes, mensajeDeError, partesBogota } from '../../lib/pedidoAdmin'
import { ANTICIPO_PORCENTAJE } from '../../lib/politicas'
import { horaEnPalabras, horasParaAcordar } from '../../lib/horario'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { useSnackbar } from '../ui/Snackbar'

/**
 * Diálogo del panel de Taller para asentar lo que se acordó por fuera con el cliente: fecha y hora, entrega
 * y anticipo. La plataforma es el registro canónico; WhatsApp es solo la conversación.
 * @prop pedido - Pedido a editar, o null con el diálogo cerrado.
 * @prop onCerrar - Cierra el diálogo.
 * @prop onGuardado - Recibe el pedido actualizado que devolvió el server.
 */
export function AcuerdoDialog({
  pedido,
  onCerrar,
  onGuardado,
}: {
  pedido: PedidoAdmin | null
  onCerrar: () => void
  onGuardado: (p: PedidoAdmin) => void
}) {
  return (
    <Dialog
      abierto={pedido !== null}
      titulo={pedido ? `Acuerdo de ${codigoPedido(pedido._id)}` : 'Acuerdo'}
      onCerrar={onCerrar}
    >
      {pedido && <FormularioAcuerdo key={pedido._id} pedido={pedido} onCerrar={onCerrar} onGuardado={onGuardado} />}
    </Dialog>
  )
}

function FormularioAcuerdo({
  pedido,
  onCerrar,
  onGuardado,
}: {
  pedido: PedidoAdmin
  onCerrar: () => void
  onGuardado: (p: PedidoAdmin) => void
}) {
  const acordada = pedido.fechaEntrega ? partesBogota(pedido.fechaEntrega) : { fecha: '', hora: '' }
  const [fecha, setFecha] = useState(acordada.fecha)
  const [hora, setHora] = useState(acordada.hora)
  const [metodo, setMetodo] = useState<MetodoEntrega>(pedido.entrega.metodo)
  const [detalle, setDetalle] = useState(pedido.entrega.detalle)
  const [monto, setMonto] = useState(pedido.pago ? String(pedido.pago.monto) : '')
  const [medio, setMedio] = useState<MedioPago>(pedido.pago?.medio ?? 'nequi')
  const [errores, setErrores] = useState<{ fecha?: string; monto?: string }>({})
  const [guardando, setGuardando] = useState(false)
  const { avisar } = useSnackbar()

  // las horas son las del dia elegido; en un dia sin servicio, las de un dia ordinario (la excepcion la promete el taller)
  const opcionesHora = horasParaAcordar(fecha).map((h) => ({
    valor: `${String(h).padStart(2, '0')}:00`,
    texto: horaEnPalabras(h),
  }))

  async function guardar(e: FormEvent) {
    e.preventDefault()
    const nuevos: typeof errores = {}
    if (Boolean(fecha) !== Boolean(hora)) nuevos.fecha = 'Completa fecha y hora, o deja las dos vacías.'
    if (monto && !(Number.isInteger(Number(monto)) && Number(monto) > 0)) {
      nuevos.monto = 'El anticipo es un monto entero mayor a 0, sin puntos ni comas.'
    }
    setErrores(nuevos)
    if (Object.keys(nuevos).length > 0) return

    const cuerpo: Record<string, unknown> = {
      entrega: { metodo, detalle: metodo === 'domicilio' ? detalle : '' },
    }
    if (fecha && hora) cuerpo.fechaEntrega = isoDesdePartes(fecha, hora)
    else if (!fecha && !hora && pedido.fechaEntrega) cuerpo.fechaEntrega = null
    // solo se registra un anticipo nuevo o distinto: reenviar el mismo moveria su fecha de registro
    const montoNuevo = monto ? Number(monto) : null
    if (montoNuevo !== null && (montoNuevo !== pedido.pago?.monto || medio !== pedido.pago?.medio)) {
      cuerpo.pago = { monto: montoNuevo, medio }
    }

    setGuardando(true)
    try {
      const actualizado = await api.patch<PedidoAdmin>(`/pedidos/${pedido._id}/acuerdo`, cuerpo)
      onGuardado(actualizado)
      avisar(`Acuerdo de ${codigoPedido(pedido._id)} guardado.`)
      onCerrar()
    } catch (err) {
      avisar(mensajeDeError(err, 'No pudimos guardar el acuerdo. Prueba de nuevo.'), { tono: 'error' })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={guardar} noValidate className="flex flex-col gap-4">
      <p className="text-sm text-texto-secundario">
        {pedido.fechaDeseada
          ? `El cliente pidió: ${fechaConHora(pedido.fechaDeseada)}.`
          : 'El cliente no indicó fecha.'}
      </p>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Fecha acordada"
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          error={errores.fecha}
        />
        <Select label="Hora acordada" value={hora} onChange={(e) => setHora(e.target.value)}>
          <option value="">Sin hora</option>
          {opcionesHora.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.texto}
            </option>
          ))}
        </Select>
      </div>

      <Select label="Entrega" value={metodo} onChange={(e) => setMetodo(e.target.value as MetodoEntrega)}>
        <option value="recoger">Recoge en el taller</option>
        <option value="domicilio">Domicilio</option>
      </Select>
      {metodo === 'domicilio' && (
        <Input label="Dirección de entrega" maxLength={200} value={detalle} onChange={(e) => setDetalle(e.target.value)} />
      )}

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Anticipo recibido"
          type="number"
          min="1"
          step="1"
          inputMode="numeric"
          hint={`Lo habitual es el ${ANTICIPO_PORCENTAJE}% del valor acordado.`}
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          error={errores.monto}
          className="tabular-nums"
        />
        <Select label="Medio del anticipo" value={medio} onChange={(e) => setMedio(e.target.value as MedioPago)}>
          {MEDIOS_PAGO.map((m) => (
            <option key={m} value={m}>
              {ETIQUETAS_MEDIO_PAGO[m]}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variante="fantasma" disabled={guardando} onClick={onCerrar}>
          Cancelar
        </Button>
        <Button type="submit" cargando={guardando}>
          Guardar acuerdo
        </Button>
      </div>
    </form>
  )
}
