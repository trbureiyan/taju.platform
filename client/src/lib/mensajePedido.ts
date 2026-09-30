import type { Pedido } from '../types'
import { codigoPedido } from './pedido'
import { resumenDesdePedido } from './resumenPedido'

/**
 * Resumen que el cliente puede mandar al taller por WhatsApp. Cada chat nace anclado a un codigo de pedido;
 * el envio es manual, asi que es una comodidad y nunca un mecanismo: la solicitud ya existe en la plataforma.
 * Sale de las mismas lineas que la hoja de resumen y la pantalla de exito.
 */
export function mensajeResumenPedido(p: Pedido): string {
  const lineas = resumenDesdePedido(p)
    .filter((l) => l.valor !== null)
    .map((l) => `${l.etiqueta}: ${l.valor}`)
  return [`Hola, acabo de enviar la solicitud ${codigoPedido(p._id)} en la página.`, ...lineas].join('\n')
}

/** Mensaje con el que el taller abre la conversacion con el cliente sobre su solicitud. */
export function mensajeAlCliente(p: Pick<Pedido, '_id' | 'producto' | 'contacto'>): string {
  return `Hola ${p.contacto.nombre}, te escribimos de TaJú por tu solicitud ${codigoPedido(p._id)} (${p.producto.nombre}).`
}
