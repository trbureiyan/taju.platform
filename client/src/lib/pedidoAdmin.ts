import type { EstadoPedido, PedidoAdmin } from '../types'
import { ErrorApi } from './api'
import { DIAS_SIN_RESPUESTA } from './politicas'
import { limiteDeContacto } from './horario'

// mapa lineal a proposito - el admin solo avanza un paso; cancelar es una accion aparte (ver pedidos.service)
export const SIGUIENTE_ESTADO: Partial<Record<EstadoPedido, EstadoPedido>> = {
  recibido: 'en_revision',
  en_revision: 'confirmado',
  confirmado: 'en_produccion',
  en_produccion: 'listo_para_entrega',
  listo_para_entrega: 'entregado',
}

// espejo de TRANSICIONES del server: desde produccion ya es un compromiso y no se cancela por aqui
const CANCELABLES: readonly EstadoPedido[] = ['recibido', 'en_revision', 'confirmado']
const ABIERTAS: readonly EstadoPedido[] = ['recibido', 'en_revision']

export function sePuedeCancelar(estado: EstadoPedido): boolean {
  return CANCELABLES.includes(estado)
}

/**
 * Espejo de faltantesParaAvanzar del server (pedidos.service.ts), con los mismos textos: asi el boton se
 * deshabilita con el motivo a la vista en lugar de descubrirlo al fallar. El server es quien lo hace cumplir.
 */
export function faltantesParaAvanzar(p: PedidoAdmin, destino: EstadoPedido): string[] {
  const faltan: string[] = []
  if (destino === 'confirmado') {
    if (!p.contactadoEn) faltan.push('marcar que ya hablaste con el cliente')
    if (!p.fechaEntrega) faltan.push('la fecha de entrega acordada')
    if (p.entrega.metodo === 'domicilio' && !p.entrega.detalle.trim()) faltan.push('la dirección de entrega')
  }
  if (destino === 'en_produccion' && !p.pago) faltan.push('el anticipo')
  return faltan
}

/** La medida personalizada exige una confirmacion explicita del taller al entrar a produccion. */
export function requiereConfirmacionDimension(p: PedidoAdmin, destino: EstadoPedido): boolean {
  return destino === 'en_produccion' && p.dimensiones.esDimensionPersonalizada && !p.confirmacionDimensionPersonalizada
}

/** Solicitud abierta a la que el taller todavia no le ha escrito. */
export function estaSinContactar(p: PedidoAdmin): boolean {
  return !p.contactadoEn && ABIERTAS.includes(p.estado)
}

/** El plazo de contacto prometido al cliente ya paso y sigue sin escribirsele. */
export function promesaVencida(p: PedidoAdmin, ahora: Date): boolean {
  return estaSinContactar(p) && ahora.getTime() > limiteDeContacto(new Date(p.fechaSolicitud)).getTime()
}

const DIA_MS = 86_400_000

/** Solicitud abierta sin novedad hace DIAS_SIN_RESPUESTA dias o mas (desde el contacto, o desde que llego). */
export function estaVencida(p: PedidoAdmin, ahora: Date): boolean {
  if (!ABIERTAS.includes(p.estado)) return false
  const desde = new Date(p.contactadoEn ?? p.fechaSolicitud).getTime()
  return ahora.getTime() - desde >= DIAS_SIN_RESPUESTA * DIA_MS
}

export function textoEntrega(p: PedidoAdmin): string {
  if (p.entrega.metodo === 'recoger') return 'Recoge en el taller'
  return p.entrega.detalle ? `Domicilio: ${p.entrega.detalle}` : 'Domicilio (falta dirección)'
}

const formatoPartes = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Bogota',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  hourCycle: 'h23',
})

/** Fecha `YYYY-MM-DD` y hora `HH:00` en Colombia, listas para un input date y un select de hora. */
export function partesBogota(iso: string): { fecha: string; hora: string } {
  const p = Object.fromEntries(formatoPartes.formatToParts(new Date(iso)).map((x) => [x.type, x.value]))
  return { fecha: `${p.year}-${p.month}-${p.day}`, hora: `${p.hour}:00` }
}

/** Inverso de `partesBogota`: hora de Colombia fija (-05:00, sin horario de verano). */
export function isoDesdePartes(fecha: string, hora: string): string {
  return new Date(`${fecha}T${hora}:00-05:00`).toISOString()
}

/**
 * Texto a mostrar cuando una accion del panel falla.
 * [DECISION] solo el 409 trae un motivo escrito para leerse (compuerta, pedido cerrado); red caida, 500 o un
 * 400 de validacion caen al texto neutro para no exponer mensajes de sistema. Mismo criterio que AccionesPedido.
 * @param err - Lo que rechazo la llamada a la API.
 * @param respaldo - Texto neutro para cualquier otro fallo.
 */
export function mensajeDeError(err: unknown, respaldo: string): string {
  return err instanceof ErrorApi && err.estado === 409 ? err.message : respaldo
}
