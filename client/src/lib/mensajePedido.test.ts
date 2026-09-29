import { describe, it, expect } from 'vitest'
import { mensajeResumenPedido, mensajeAlCliente } from './mensajePedido'
import { codigoPedido } from './pedido'
import { pedido } from '../test/pedidos'

describe('mensajeResumenPedido', () => {
  it('ancla el chat al codigo y lleva lo que el taller necesita para cotizar', () => {
    const p = pedido({
      _id: 'abc123',
      nombre: 'Topper luna',
      fechaDeseada: '2026-12-12T22:00:00.000Z',
      entrega: { metodo: 'domicilio', detalle: 'Cra 5 # 10-20' },
    })

    const texto = mensajeResumenPedido(p)

    expect(texto).toContain(codigoPedido('abc123'))
    expect(texto).toContain('Producto: Topper luna')
    expect(texto).toContain('Medida: 22 cm')
    expect(texto).toMatch(/Fecha deseada: sábado, 12 de diciembre/)
    expect(texto).toContain('Entrega: a domicilio (Cra 5 # 10-20)')
    expect(texto).toContain('Descripción: Descripcion del pedido')
  })

  it('sin fecha deseada omite la linea, y recoger dice que pasa por el taller', () => {
    const texto = mensajeResumenPedido(pedido({ fechaDeseada: null }))

    expect(texto).not.toContain('Fecha deseada')
    expect(texto).toContain('Entrega: la recojo en el taller')
  })

  it('marca la medida personalizada', () => {
    expect(mensajeResumenPedido(pedido({ esDimensionPersonalizada: true }))).toContain('Medida: 22 cm (personalizada)')
  })
})

describe('mensajeAlCliente', () => {
  it('saluda por el nombre y nombra la solicitud por su codigo', () => {
    const texto = mensajeAlCliente(pedido({ _id: 'abc123', nombre: 'Topper luna' }))
    expect(texto).toBe(`Hola Laura, te escribimos de TaJú por tu solicitud ${codigoPedido('abc123')} (Topper luna).`)
  })
})
