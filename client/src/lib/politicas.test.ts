import { describe, it, expect } from 'vitest'
import { esFestivo, festivosDelAnio } from './politicas'
import { relojBogota } from './horario'

// Las fechas de 2026 a 2028 son las de la lista escrita a mano que estuvo en politicas.ts (verificada con una
// implementacion independiente de Pascua y Ley Emiliani). 2025 es un caso de control adicional: si una fecha de
// 2025 no coincide, NO se ajusta el algoritmo a ciegas; se contrasta con la fuente oficial y se reporta.
const ESPERADOS: Record<number, string[]> = {
  2025: [
    '2025-01-01', '2025-01-06', '2025-03-24', '2025-04-17', '2025-04-18', '2025-05-01',
    '2025-06-02', '2025-06-23', '2025-06-30', '2025-07-20', '2025-08-07', '2025-08-18',
    '2025-10-13', '2025-11-03', '2025-11-17', '2025-12-08', '2025-12-25',
  ],
  2026: [
    '2026-01-01', '2026-01-12', '2026-03-23', '2026-04-02', '2026-04-03', '2026-05-01',
    '2026-05-18', '2026-06-08', '2026-06-15', '2026-06-29', '2026-07-20', '2026-08-07',
    '2026-08-17', '2026-10-12', '2026-11-02', '2026-11-16', '2026-12-08', '2026-12-25',
  ],
  2027: [
    '2027-01-01', '2027-01-11', '2027-03-22', '2027-03-25', '2027-03-26', '2027-05-01',
    '2027-05-10', '2027-05-31', '2027-06-07', '2027-07-05', '2027-07-20', '2027-08-07',
    '2027-08-16', '2027-10-18', '2027-11-01', '2027-11-15', '2027-12-08', '2027-12-25',
  ],
  2028: [
    '2028-01-01', '2028-01-10', '2028-03-20', '2028-04-13', '2028-04-14', '2028-05-01',
    '2028-05-29', '2028-06-19', '2028-06-26', '2028-07-03', '2028-07-20', '2028-08-07',
    '2028-08-21', '2028-10-16', '2028-11-06', '2028-11-13', '2028-12-08', '2028-12-25',
  ],
}

describe('festivosDelAnio', () => {
  it.each([2025, 2026, 2027, 2028])('coincide con los festivos conocidos de %i', (anio) => {
    expect([...festivosDelAnio(anio)].sort()).toEqual(ESPERADOS[anio])
  })

  // 2025 trae 17 fechas distintas porque el Sagrado Corazon y San Pedro y San Pablo coinciden el 30 de junio
  it.each([2026, 2027, 2028])('%i tiene los 18 festivos de Colombia', (anio) => {
    expect(festivosDelAnio(anio).size).toBe(18)
  })

  // Ley Emiliani: estos se trasladan al lunes siguiente; un error del calculo se delata aqui
  it.each(['2026-01-12', '2026-03-23', '2026-08-17', '2026-11-02', '2026-11-16', '2027-07-05', '2028-08-21'])(
    '%s cae en lunes',
    (fecha) => {
      expect(relojBogota(new Date(`${fecha}T12:00:00-05:00`)).dia).toBe(1)
    },
  )

  it('calcula anos lejanos sin lista escrita', () => {
    expect(festivosDelAnio(2031).size).toBeGreaterThanOrEqual(17)
    expect(esFestivo('2031-12-25')).toBe(true)
  })
})

describe('esFestivo', () => {
  it('distingue un festivo de un dia comun', () => {
    expect(esFestivo('2026-12-25')).toBe(true)
    expect(esFestivo('2026-12-24')).toBe(false)
  })

  it('Jueves y Viernes Santo salen de la Pascua', () => {
    expect(esFestivo('2026-04-02')).toBe(true) // Pascua 2026-04-05
    expect(esFestivo('2027-03-26')).toBe(true) // Pascua 2027-03-28
    expect(esFestivo('2028-04-14')).toBe(true) // Pascua 2028-04-16
  })
})
