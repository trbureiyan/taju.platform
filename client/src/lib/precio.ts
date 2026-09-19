import type { Precio } from '../types'

// texto corto para tarjeta/detalle - superficies muestra "desde" porque el precio real depende de la
// cantidad (ver AGENTS.md: escala de precios, minimo 12 unidades); el resto muestra el precio unitario fijo
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

// resumen del total para una cantidad puntual (PedidoFormPage) - null cuando no hay suficiente info para cotizar
// (superficies exige el minimo de la escala mas baja, ver AGENTS.md) para no mostrar un numero enganoso
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
