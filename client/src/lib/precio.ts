import type { Precio } from '../types'

/**
 * Formatea el precio para mostrar en tarjeta o detalle de producto.
 * Para la familia superficies (escalas) muestra "Desde $X c/u (mín. N unidades)" apuntando
 * a la escala de menor cantidad mínima — que es el precio de entrada real, no el más bajo posible.
 * Para precio unitario fijo muestra "$X". Si no hay precio definido devuelve "Precio a consultar".
 * @param precio - Objeto Precio con unitario y/o escalas.
 * @returns Cadena lista para mostrar en la UI.
 */
export function formatearPrecio(precio: Precio): string {
  if (precio.escalas.length > 0) {
    // la escala de menor cantidad minima es el punto de entrada real - "desde" apunta ahi, no al precio mas bajo posible
    const entrada = [...precio.escalas].sort((a, b) => a.cantidadMinima - b.cantidadMinima)[0]
    return `Desde $${entrada.precioUnitario.toLocaleString('es-CO')} c/u (mín. ${entrada.cantidadMinima} unidades)`
  }
  if (precio.unitario != null) {
    return `$${precio.unitario.toLocaleString('es-CO')}`
  }
  return 'Precio a consultar'
}

/**
 * Calcula el total para una cantidad puntual, usado en PedidoFormPage.
 * Para superficies (escalas) aplica la escala de mayor cantidadMinima que la cantidad pedida cubra.
 * Si la cantidad no alcanza el mínimo de ninguna escala, devuelve null (no se muestra precio engañoso).
 * Para precio unitario fijo, siempre hay resultado mientras haya precio definido.
 * @param precio - Objeto Precio con unitario y/o escalas.
 * @param cantidad - Cantidad solicitada (entero positivo).
 * @returns Objeto { total, unitario } o null si no hay información suficiente para cotizar.
 */
export function calcularPrecioTotal(precio: Precio, cantidad: number): { total: number; unitario: number } | null {
  if (precio.escalas.length > 0) {
    // la escala aplicable es la de mayor cantidadMinima que la cantidad pedida todavia cubre
    const aplicable = [...precio.escalas]
      .sort((a, b) => a.cantidadMinima - b.cantidadMinima)
      .filter((e) => cantidad >= e.cantidadMinima)
      .pop()
    if (!aplicable) return null
    return { total: aplicable.precioUnitario * cantidad, unitario: aplicable.precioUnitario }
  }
  if (precio.unitario != null) {
    return { total: precio.unitario * cantidad, unitario: precio.unitario }
  }
  return null
}

