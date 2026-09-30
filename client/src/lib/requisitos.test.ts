import { describe, it, expect } from 'vitest'
import {
  cantidadMinimaDe,
  exigeReferencia,
  mensajeCantidadMinima,
  MENSAJE_FECHA_PASADA,
  normalizarCelular,
  REGEX_CELULAR,
} from './requisitos'

// [Review Focus] celular pegado con espacios, guiones o +57
describe('normalizarCelular', () => {
  it.each([
    ['319 245 2842', '3192452842'],
    ['319-245-2842', '3192452842'],
    ['+57 319 245 2842', '3192452842'],
    ['573192452842', '3192452842'],
    ['3192452842', '3192452842'],
  ])('%s -> %s', (entrada, esperado) => {
    expect(normalizarCelular(entrada)).toBe(esperado)
  })

  it('un numero incompleto se deja tal cual para que la validacion lo explique', () => {
    expect(normalizarCelular('319 245')).toBe('319245')
    expect(REGEX_CELULAR.test(normalizarCelular('319 245'))).toBe(false)
  })

  it('un fijo o un numero que no empieza en 3 no pasa', () => {
    expect(REGEX_CELULAR.test('6088712345')).toBe(false)
    expect(REGEX_CELULAR.test('3192452842')).toBe(true)
  })
})

describe('exigeReferencia', () => {
  it('toppers exige imagen de referencia y las demas familias no', () => {
    expect(exigeReferencia('toppers')).toBe(true)
    expect(exigeReferencia('superficies')).toBe(false)
    expect(exigeReferencia('senaletica')).toBe(false)
    expect(exigeReferencia('papeleria')).toBe(false)
  })
})

describe('minimo por escala', () => {
  it('cantidadMinimaDe usa la menor escala, o 1 sin escalas', () => {
    expect(cantidadMinimaDe({ unitario: null, escalas: [{ cantidadMinima: 50, precioUnitario: 8000 }, { cantidadMinima: 12, precioUnitario: 9000 }] })).toBe(12)
    expect(cantidadMinimaDe({ unitario: 35000, escalas: [] })).toBe(1)
  })

  it('el mensaje dice que paso, por que y que hacer, igual que el del servidor', () => {
    expect(mensajeCantidadMinima(12)).toBe(
      'Este producto se pide desde 12 unidades: el precio por escala solo aplica a partir de ahí. Sube la cantidad o escríbenos por WhatsApp si necesitas menos.',
    )
  })

  it('el mensaje de fecha pasada coincide con el del servidor', () => {
    expect(MENSAJE_FECHA_PASADA).toBe(
      'Esa fecha ya pasó. Elige una a partir de mañana, que es lo mínimo que necesitamos para producir.',
    )
  })
})
