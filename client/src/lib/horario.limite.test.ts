import { describe, it, expect, vi } from 'vitest'
import { diasConServicio, MAX_DIAS_BUSQUEDA, siguienteDiaConServicio } from './horario'

// una tabla sin ningun dia con servicio (una edicion equivocada de politicas.ts) no puede colgar la pestaña
vi.mock('./politicas', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./politicas')>()),
  HORARIO_SEMANAL: { 0: null, 1: null, 2: null, 3: null, 4: null, 5: null, 6: null },
}))

describe('horario | tope de busqueda', () => {
  it('busca como mucho un año', () => {
    expect(MAX_DIAS_BUSQUEDA).toBe(366)
  })

  it('siguienteDiaConServicio falla con un error claro si ningun dia atiende', () => {
    expect(() => siguienteDiaConServicio(new Date('2026-09-28T10:00:00-05:00'))).toThrow(/HORARIO_SEMANAL/)
  })

  it('diasConServicio falla con un error claro si ningun dia atiende', () => {
    expect(() => diasConServicio('2026-09-29', 14)).toThrow(/HORARIO_SEMANAL/)
  })
})
