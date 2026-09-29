import { describe, it, expect } from 'vitest'
import { FESTIVOS, esFestivo } from './politicas'
import { relojBogota } from './horario'

describe('FESTIVOS', () => {
  it.each(['2026', '2027', '2028'])('tiene los 18 festivos de %s', (anio) => {
    expect([...FESTIVOS].filter((f) => f.startsWith(anio))).toHaveLength(18)
  })

  it('esFestivo distingue un festivo de un dia comun', () => {
    expect(esFestivo('2026-12-25')).toBe(true)
    expect(esFestivo('2026-12-24')).toBe(false)
  })

  // Ley Emiliani: estos festivos se trasladan al lunes siguiente; un error de dedo en la lista lo delata
  it.each(['2026-01-12', '2026-03-23', '2026-08-17', '2026-11-02', '2026-11-16', '2027-07-05', '2028-08-21'])(
    '%s cae en lunes',
    (fecha) => {
      expect(relojBogota(new Date(`${fecha}T12:00:00-05:00`)).dia).toBe(1)
    },
  )
})
