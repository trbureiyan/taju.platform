import { describe, it, expect } from 'vitest'
import { validarFechaDeseada } from './fechaDeseada'
import { MENSAJE_FALTA_FECHA } from './requisitos'

const sabadoEnLaTarde = new Date('2026-10-03T15:00:00-05:00') // el primer dia disponible es el lunes 5

describe('validarFechaDeseada', () => {
  it('sin fecha, pide la fecha', () => {
    expect(validarFechaDeseada('', sabadoEnLaTarde)).toBe(MENSAJE_FALTA_FECHA)
  })

  it('antes del primer dia disponible dice cual es', () => {
    expect(validarFechaDeseada('2026-10-04', sabadoEnLaTarde)).toBe(
      'Esa fecha es muy pronto para producirla. El primer día disponible es el lunes, 5 de octubre.',
    )
  })

  it('un domingo posterior al minimo explica que no hay servicio y el siguiente dia', () => {
    expect(validarFechaDeseada('2026-10-11', sabadoEnLaTarde)).toMatch(/Los domingos no hay servicio/)
  })

  it('un lunes festivo explica que el taller esta cerrado', () => {
    expect(validarFechaDeseada('2026-10-12', sabadoEnLaTarde)).toMatch(/festivo y el taller está cerrado/)
  })

  it('un dia con servicio a partir del minimo es valido', () => {
    expect(validarFechaDeseada('2026-10-05', sabadoEnLaTarde)).toBeNull()
    expect(validarFechaDeseada('2026-10-10', sabadoEnLaTarde)).toBeNull() // sabado
  })
})
