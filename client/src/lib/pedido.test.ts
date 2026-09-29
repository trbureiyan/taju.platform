import { describe, it, expect } from 'vitest'
import { codigoPedido, SIGUIENTE_PASO, enCurso, avance, fechaConHora } from './pedido'
import { ESTADOS_PEDIDO } from '../types'

describe('codigoPedido', () => {
  it('deriva TJ- + los ultimos 6 caracteres del id en mayuscula', () => {
    expect(codigoPedido('64f1a2b3c4d5e6f7a8b93f9a2c')).toBe('TJ-3F9A2C')
  })
})

describe('SIGUIENTE_PASO', () => {
  it('tiene un mensaje para cada uno de los siete estados', () => {
    for (const estado of ESTADOS_PEDIDO) {
      expect(SIGUIENTE_PASO[estado]).toBeTruthy()
    }
  })

  it('recibido explica que es una solicitud, no una compra', () => {
    expect(SIGUIENTE_PASO.recibido).toMatch(/recibimos tu solicitud/i)
  })
})

describe('enCurso', () => {
  it('es true mientras el pedido siga vivo y false al entregarse o cancelarse', () => {
    expect(enCurso('recibido')).toBe(true)
    expect(enCurso('listo_para_entrega')).toBe(true)
    expect(enCurso('entregado')).toBe(false)
    expect(enCurso('cancelado')).toBe(false)
  })
})

describe('avance', () => {
  it('devuelve la posicion del paso dentro del flujo y -1 para cancelado, que no es un paso', () => {
    expect(avance('recibido')).toBe(0)
    expect(avance('en_produccion')).toBe(3)
    expect(avance('entregado')).toBe(5)
    expect(avance('cancelado')).toBe(-1)
  })
})

describe('fechaConHora', () => {
  it('escribe dia, fecha y hora en la hora de Colombia sin depender de la zona del dispositivo', () => {
    expect(fechaConHora('2026-12-12T17:00:00-05:00')).toMatch(/sábado.*12 de diciembre.*5:00/)
  })
})
