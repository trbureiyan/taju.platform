import { describe, it, expect } from 'vitest'
import { partesPrecio, precioParaOrden, formatearPesos } from './precio'

describe('partesPrecio', () => {
  it('unidad', () => {
    expect(partesPrecio({ unitario: 45000, escalas: [] })).toEqual({ tipo: 'unidad', valor: 45000 })
  })

  it('escala: toma la de menor minimo como punto de entrada', () => {
    expect(
      partesPrecio({
        unitario: null,
        escalas: [
          { cantidadMinima: 100, precioUnitario: 1900 },
          { cantidadMinima: 12, precioUnitario: 2500 },
        ],
      })
    ).toEqual({ tipo: 'escala', valor: 2500, minimo: 12 })
  })

  it('sin precio', () => {
    expect(partesPrecio({ unitario: null, escalas: [] })).toEqual({ tipo: 'consultar' })
  })
})

describe('precioParaOrden', () => {
  it('devuelve el precio de entrada o null', () => {
    expect(precioParaOrden({ unitario: 5000, escalas: [] })).toBe(5000)
    expect(precioParaOrden({ unitario: null, escalas: [] })).toBeNull()
  })
})

describe('formatearPesos', () => {
  it('separador de miles con punto y sin decimales', () => {
    expect(formatearPesos(45000)).toBe('$45.000')
    expect(formatearPesos(1250000)).toBe('$1.250.000')
  })
})
