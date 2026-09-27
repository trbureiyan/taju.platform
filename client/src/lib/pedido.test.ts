import { describe, it, expect } from 'vitest'
import { codigoPedido, SIGUIENTE_PASO, enCurso, avance } from './pedido'
import { ESTADOS_PEDIDO } from '../types'

describe('codigoPedido', () => {
  it('deriva TJ- + los ultimos 6 caracteres del id en mayuscula', () => {
    expect(codigoPedido('64f1a2b3c4d5e6f7a8b93f9a2c')).toBe('TJ-3F9A2C')
  })
})

describe('SIGUIENTE_PASO', () => {
  it('tiene un mensaje para cada uno de los seis estados', () => {
    for (const estado of ESTADOS_PEDIDO) {
      expect(SIGUIENTE_PASO[estado]).toBeTruthy()
    }
  })
})

describe('enCurso', () => {
  it('es true para los primeros cinco estados y false para entregado', () => {
    expect(enCurso('recibido')).toBe(true)
    expect(enCurso('listo_para_entrega')).toBe(true)
    expect(enCurso('entregado')).toBe(false)
  })
})

describe('avance', () => {
  it('devuelve el indice del estado dentro de ESTADOS_PEDIDO', () => {
    expect(avance('recibido')).toBe(0)
    expect(avance('en_produccion')).toBe(3)
    expect(avance('entregado')).toBe(5)
  })
})
