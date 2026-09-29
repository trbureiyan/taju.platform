import { describe, it, expect } from 'vitest'
import { faltantesDeSolicitud, MENSAJE_FALTA_FECHA, MENSAJE_FALTA_REFERENCIA } from './pedidos.requisitos.js'
import { FAMILIAS } from '../../types/index.js'

const fecha = new Date('2026-12-12T17:00:00.000Z')

describe('faltantesDeSolicitud', () => {
  it('una solicitud de papeleria con fecha esta completa sin imagen', () => {
    expect(faltantesDeSolicitud({ familia: 'papeleria', fechaDeseada: fecha, cantidadReferencias: 0 })).toEqual([])
  })

  it('un topper sin imagen de referencia no esta completo', () => {
    expect(faltantesDeSolicitud({ familia: 'toppers', fechaDeseada: fecha, cantidadReferencias: 0 })).toEqual([
      MENSAJE_FALTA_REFERENCIA,
    ])
  })

  it('un topper con una referencia esta completo', () => {
    expect(faltantesDeSolicitud({ familia: 'toppers', fechaDeseada: fecha, cantidadReferencias: 1 })).toEqual([])
  })

  it.each(FAMILIAS)('la fecha se pide en %s', (familia) => {
    expect(faltantesDeSolicitud({ familia, fechaDeseada: null, cantidadReferencias: 3 })).toEqual([
      MENSAJE_FALTA_FECHA,
    ])
  })
})
