import type { Pedido } from '../types'
import { codigoPedido, fechaConHora } from './pedido'

/**
 * Resumen que el cliente puede mandar al taller por WhatsApp. Cada chat nace anclado a un codigo de pedido;
 * el envio es manual, asi que es una comodidad y nunca un mecanismo: la solicitud ya existe en la plataforma.
 */
export function mensajeResumenPedido(p: Pedido): string {
  const entrega =
    p.entrega.metodo === 'domicilio'
      ? `a domicilio${p.entrega.detalle ? ` (${p.entrega.detalle})` : ''}`
      : 'la recojo en el taller'
  const lineas = [
    `Hola, acabo de enviar la solicitud ${codigoPedido(p._id)} en la página.`,
    `Producto: ${p.producto.nombre}`,
    `Medida: ${p.dimensiones.valor} ${p.dimensiones.unidad}${p.dimensiones.esDimensionPersonalizada ? ' (personalizada)' : ''}`,
    `Cantidad: ${p.cantidad}`,
    `Colores: ${p.colores}`,
    `Materiales: ${p.materiales}`,
    p.fechaDeseada ? `Fecha deseada: ${fechaConHora(p.fechaDeseada)}` : null,
    `Entrega: ${entrega}`,
    `Descripción: ${p.descripcion}`,
  ]
  return lineas.filter((l): l is string => l !== null).join('\n')
}

/** Mensaje con el que el taller abre la conversacion con el cliente sobre su solicitud. */
export function mensajeAlCliente(p: Pick<Pedido, '_id' | 'producto' | 'contacto'>): string {
  return `Hola ${p.contacto.nombre}, te escribimos de TaJú por tu solicitud ${codigoPedido(p._id)} (${p.producto.nombre}).`
}
