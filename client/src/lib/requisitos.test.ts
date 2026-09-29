import { describe, it, expect } from 'vitest'
import { exigeReferencia, normalizarCelular, REGEX_CELULAR } from './requisitos'

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
