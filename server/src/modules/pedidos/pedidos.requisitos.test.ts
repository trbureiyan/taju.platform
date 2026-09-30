import { describe, it, expect } from 'vitest'
import {
  cantidadMinimaDe,
  faltantesDeSolicitud,
  inicioDelDiaEnBogota,
  mensajeCantidadMinima,
  MENSAJE_FALTA_FECHA,
  MENSAJE_FALTA_REFERENCIA,
  MENSAJE_FECHA_PASADA,
} from './pedidos.requisitos.js'
import { FAMILIAS } from '../../types/index.js'

const ahora = new Date('2026-09-29T15:00:00.000Z')
const base = { fechaDeseada: new Date('2026-12-12T17:00:00.000Z'), cantidadReferencias: 1, cantidad: 1, cantidadMinima: 1, ahora }

describe('faltantesDeSolicitud', () => {
  it('una solicitud de papeleria con fecha esta completa sin imagen', () => {
    expect(faltantesDeSolicitud({ ...base, familia: 'papeleria', cantidadReferencias: 0 })).toEqual([])
  })

  it('un topper sin imagen de referencia no esta completo', () => {
    expect(faltantesDeSolicitud({ ...base, familia: 'toppers', cantidadReferencias: 0 })).toEqual([
      MENSAJE_FALTA_REFERENCIA,
    ])
  })

  it('un topper con una referencia esta completo', () => {
    expect(faltantesDeSolicitud({ ...base, familia: 'toppers', cantidadReferencias: 1 })).toEqual([])
  })

  it.each(FAMILIAS)('la fecha se pide en %s', (familia) => {
    expect(faltantesDeSolicitud({ ...base, familia, fechaDeseada: null, cantidadReferencias: 3 })).toEqual([
      MENSAJE_FALTA_FECHA,
    ])
  })
})

describe('minimo de la familia', () => {
  it('rechaza menos unidades que el minimo, con el porque y que hacer', () => {
    const faltan = faltantesDeSolicitud({ ...base, familia: 'superficies', cantidad: 5, cantidadMinima: 12 })
    expect(faltan).toEqual([mensajeCantidadMinima(12)])
    expect(faltan[0]).toMatch(/desde 12 unidades/)
    expect(faltan[0]).toMatch(/precio por escala/)
  })

  it('acepta justo el minimo y mas', () => {
    expect(faltantesDeSolicitud({ ...base, familia: 'superficies', cantidad: 12, cantidadMinima: 12 })).toEqual([])
    expect(faltantesDeSolicitud({ ...base, familia: 'superficies', cantidad: 30, cantidadMinima: 12 })).toEqual([])
  })

  it('cantidadMinimaDe usa la menor escala, o 1 sin escalas', () => {
    expect(cantidadMinimaDe([{ cantidadMinima: 50 }, { cantidadMinima: 12 }])).toBe(12)
    expect(cantidadMinimaDe([])).toBe(1)
  })
})

describe('fecha deseada no pasada', () => {
  it('inicioDelDiaEnBogota es la medianoche de Bogota, no la de UTC', () => {
    // 22:00 del 28 en Bogota ya es el 29 en UTC
    expect(inicioDelDiaEnBogota(new Date('2026-09-29T03:00:00.000Z')).toISOString()).toBe('2026-09-28T05:00:00.000Z')
  })

  it('rechaza una fecha anterior al dia de hoy en Bogota', () => {
    const faltan = faltantesDeSolicitud({ ...base, familia: 'papeleria', fechaDeseada: new Date('2026-09-28T04:59:00.000Z'), ahora: new Date('2026-09-29T03:00:00.000Z') })
    expect(faltan).toEqual([MENSAJE_FECHA_PASADA])
  })

  it('acepta la de hoy en Bogota aunque en UTC ya sea otro dia', () => {
    const faltan = faltantesDeSolicitud({ ...base, familia: 'papeleria', fechaDeseada: new Date('2026-09-28T22:00:00.000Z'), ahora: new Date('2026-09-29T03:00:00.000Z') })
    expect(faltan).toEqual([])
  })

  it('no valida el dia de la semana: un domingo se acepta (el servidor no lleva el calendario)', () => {
    // domingo 4 de octubre de 2026
    expect(faltantesDeSolicitud({ ...base, familia: 'papeleria', fechaDeseada: new Date('2026-10-04T15:00:00.000Z') })).toEqual([])
  })
})
