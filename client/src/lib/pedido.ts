import { ESTADOS_PEDIDO, type EstadoPedido } from '../types'

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
  recibido: 'Lo estamos revisando. Te escribimos por WhatsApp si nos falta algo.',
  en_revision: 'Estamos revisando los detalles de tu pedido.',
  confirmado: 'Tu pedido está confirmado. Pronto empieza a cortarse.',
  en_produccion: 'Ya estamos cortando tu pedido.',
  listo_para_entrega: 'Ya está listo. Te escribimos para coordinar la entrega.',
  entregado: 'Entregado. Gracias por pedir con nosotros.',
}

/** Un pedido está en curso mientras no llegue a `entregado`. */
export function enCurso(estado: EstadoPedido): boolean {
  return estado !== 'entregado'
}

/** Posición del estado en la máquina de estados canónica (0 a 5), para la línea de avance. */
export function avance(estado: EstadoPedido): number {
  return ESTADOS_PEDIDO.indexOf(estado)
}
