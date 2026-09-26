import { describe, it, expect } from 'vitest'
import { familiaDesdeParam } from './familia'
import { FAMILIAS } from '../types'

describe('familiaDesdeParam', () => {
  it.each(FAMILIAS)('acepta %s', (familia) => {
    expect(familiaDesdeParam(familia)).toBe(familia)
  })

  it.each([null, '', 'xyz', 'Toppers', 'toppers '])('devuelve null para %j', (valor) => {
    expect(familiaDesdeParam(valor)).toBeNull()
  })
})
