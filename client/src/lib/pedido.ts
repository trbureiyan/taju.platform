import { FLUJO_PEDIDO, type EstadoPedido, type Pedido, type PedidoAdmin } from '../types'

/**
 * Código de pedido para nombrar el mismo pedido por WhatsApp entre cliente y taller.
 * [DECISION] derivado del _id (opción A), no secuencial - evita tocar crearPedido, la transacción de
 * idempotencia y el modelo. Ver docs/superpowers/specs/2026-09-27-mis-pedidos-design.md §2.1.
 * @param id - `_id` de Mongo del pedido.
 * @returns `TJ-` + los últimos 6 caracteres del id en mayúscula, ej. `TJ-3F9A2C`.
 */
export function codigoPedido(id: string): string {
  return `TJ-${id.slice(-6).toUpperCase()}`
}

// unica fuente del mensaje de "lo proximo que el cliente necesita saber" - lista junto a ETIQUETAS_ESTADO
export const SIGUIENTE_PASO: Record<EstadoPedido, string> = {
  recibido: 'Recibimos tu solicitud. Te escribimos por WhatsApp para confirmar precio, fecha y anticipo.',
  en_revision: 'Ya hablamos contigo. Estamos cerrando los detalles antes de confirmar.',
  confirmado: 'Tu pedido está confirmado. Empezamos a producir cuando recibamos el anticipo.',
  en_produccion: 'Ya estamos cortando tu pedido.',
  listo_para_entrega: 'Ya está listo. Coordinamos contigo la entrega.',
  entregado: 'Entregado. Gracias por pedir con nosotros.',
  cancelado: 'Este pedido se canceló. Si fue un error, escríbenos por WhatsApp.',
}

/** Un pedido está en curso mientras no llegue a `entregado` ni se cancele. */
export function enCurso(estado: EstadoPedido): boolean {
  return estado !== 'entregado' && estado !== 'cancelado'
}

/** Posición del estado en el flujo (0 a 5) para la línea de avance; -1 para `cancelado`, que no es un paso. */
export function avance(estado: EstadoPedido): number {
  return (FLUJO_PEDIDO as readonly EstadoPedido[]).indexOf(estado)
}

/**
 * Fecha y hora en la hora de Colombia, donde opera el taller, sin depender de la zona del dispositivo.
 * @param iso - Instante en ISO 8601.
 * @returns Ej. `sábado, 12 de diciembre, 5:00 p. m.`
 */
export function fechaConHora(iso: string): string {
  const fecha = new Date(iso)
  const dia = fecha.toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'America/Bogota',
  })
  const hora = fecha.toLocaleTimeString('es-CO', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Bogota',
  })
  return `${dia}, ${hora}`
}

/**
 * Completa lo que un pedido guardado antes de la solicitud no trae (contacto, entrega, fechas, anticipo). El servidor
 * actual siempre los manda, pero un documento antiguo, o un servidor sin actualizar, no: las vistas leen estos campos
 * sin proteger y un pedido asi dejaba la pantalla en blanco.
 * @param crudo - Pedido tal como llega de la API.
 * @returns El mismo pedido con los campos faltantes en su valor vacio.
 */
export function normalizarPedido<T extends Pedido | PedidoAdmin>(crudo: T): T {
  return {
    ...crudo,
    contacto: crudo.contacto ?? { nombre: '', telefono: '' },
    entrega: crudo.entrega ?? { metodo: 'recoger', detalle: '' },
    fechaDeseada: crudo.fechaDeseada ?? null,
    fechaEntrega: crudo.fechaEntrega ?? null,
    pago: crudo.pago ?? null,
    contactadoEn: crudo.contactadoEn ?? null,
  }
}
