import { describe, it, expect } from 'vitest'
import { UBICACION_TALLER, enlaceComoLlegar, urlMapaIncrustado } from './ubicacion'

describe('ubicacion del taller', () => {
  it('trae coordenadas de Neiva', () => {
    expect(UBICACION_TALLER.lat).toBeCloseTo(2.94, 1)
    expect(UBICACION_TALLER.lng).toBeCloseTo(-75.25, 1)
  })

  it('el mapa incrustado apunta a las coordenadas del taller', () => {
    const url = urlMapaIncrustado()
    expect(url).toContain('https://www.google.com/maps')
    expect(url).toContain('2.9406778,-75.2503933')
    expect(url).toContain('output=embed')
  })

  it('el enlace "cómo llegar" abre la ubicación en Google Maps', () => {
    expect(enlaceComoLlegar()).toBe('https://www.google.com/maps/search/?api=1&query=2.9406778,-75.2503933')
  })
})
