import { describe, it, expect } from 'vitest'
import { resorte, curvaToken, duracionToken } from './movimiento'

describe('movimiento', () => {
  it('convierte el spring espacial normal de M3 (0.8 / 380) a amortiguacion absoluta', () => {
    const t = resorte('espacialNormal') as { stiffness: number; damping: number; mass: number }
    expect(t.stiffness).toBe(380)
    expect(t.mass).toBe(1)
    expect(t.damping).toBeCloseTo(2 * 0.8 * Math.sqrt(380))
  })

  it('los springs de efectos son criticamente amortiguados: no rebotan', () => {
    const t = resorte('efectosNormal') as { stiffness: number; damping: number }
    expect(t.damping).toBeCloseTo(2 * Math.sqrt(t.stiffness))
  })

  it('lee curvas y duraciones de las variables CSS', () => {
    document.documentElement.style.setProperty('--curva-prueba', 'cubic-bezier(0.2, 0, 0, 1)')
    document.documentElement.style.setProperty('--duracion-prueba', '200ms')
    expect(curvaToken('--curva-prueba')).toEqual([0.2, 0, 0, 1])
    expect(duracionToken('--duracion-prueba')).toBe(0.2)
    expect(curvaToken('--no-existe')).toBeUndefined()
    expect(duracionToken('--no-existe')).toBeUndefined()
  })
})
