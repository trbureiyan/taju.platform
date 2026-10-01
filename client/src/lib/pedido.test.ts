import { describe, it, expect } from 'vitest'
import { codigoPedido, SIGUIENTE_PASO, enCurso, avance, fechaConHora, normalizarPedido } from './pedido'
import { resumenDesdePedido } from './resumenPedido'
import { pedido, antiguo } from '../test/pedidos'
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

describe('normalizarPedido', () => {
  it('completa lo que un pedido antiguo no trae para que ninguna vista lance', () => {
    const p = normalizarPedido(antiguo(pedido({})))
    expect(p.contacto).toEqual({ nombre: '', telefono: '' })
    expect(p.entrega).toEqual({ metodo: 'recoger', detalle: '' })
    expect(p.fechaDeseada).toBeNull()
    expect(p.pago).toBeNull()
    expect(p.contactadoEn).toBeNull()
  })

  it('no toca un pedido completo', () => {
    const completo = pedido({ contacto: { nombre: 'Laura', telefono: '3192452842' }, entrega: { metodo: 'domicilio', detalle: 'Barrio Cándido' } })
    expect(normalizarPedido(completo)).toEqual(completo)
  })

  it('el resumen de un pedido antiguo no lanza y omite lo que no se sabe', () => {
    const lineas = resumenDesdePedido(normalizarPedido(antiguo(pedido({}))))
    expect(lineas.find((l) => l.clave === 'celular')).toMatchObject({ valor: null })
  })
})
