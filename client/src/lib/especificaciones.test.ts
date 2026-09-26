import { describe, it, expect } from 'vitest'
import { etiquetaEspecificacion, referenciaMedida } from './especificaciones'

describe('etiquetaEspecificacion', () => {
  it('traduce las claves conocidas', () => {
    expect(etiquetaEspecificacion('ocasion')).toBe('Ocasión')
    expect(etiquetaEspecificacion('personalizacion')).toBe('Personalización')
  })

  it('una clave desconocida se muestra legible, no cruda', () => {
    expect(etiquetaEspecificacion('grosor_mm')).toBe('Grosor mm')
  })
})

describe('referenciaMedida', () => {
  it('traduce la medida a referencia de torta cuando la etiqueta es de libras', () => {
    expect(referenciaMedida({ etiqueta: 'Media libra', valor: 22, unidad: 'cm' })).toBe(
      '22 cm, torta de media libra'
    )
  })

  it('con otra etiqueta la conserva junto a la medida', () => {
    expect(referenciaMedida({ etiqueta: 'Grande', valor: 30, unidad: 'cm' })).toBe('30 cm, grande')
  })
})
