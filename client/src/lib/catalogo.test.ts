import { describe, it, expect } from 'vitest'
import { filtrarProductos, ordenarProductos, agruparPorFamilia, normalizar } from './catalogo'
import { producto } from '../test/productos'

const SIN_FILTROS = { familia: null, q: '', ocasion: null }

describe('normalizar', () => {
  it('quita tildes, mayusculas y espacios de los extremos', () => {
    expect(normalizar('  Señalética ')).toBe('senaletica')
    expect(normalizar('CUMPLEAÑOS')).toBe('cumpleanos')
  })
})

describe('filtrarProductos', () => {
  const lista = [
    producto({
      nombre: 'Letrero Feliz Cumpleaños',
      familia: 'senaletica',
      especificaciones: { ocasion: 'Cumpleaños' },
    }),
    producto({
      nombre: 'Topper nombre',
      familia: 'toppers',
      especificaciones: { ocasion: 'Grado' },
    }),
    producto({ nombre: 'Base redonda', familia: 'superficies', categoria: 'Blondas' }),
  ]

  it('busca sin importar tildes ni mayusculas', () => {
    expect(
      filtrarProductos(lista, { ...SIN_FILTROS, q: 'cumpleanos' }).map((p) => p.nombre)
    ).toEqual(['Letrero Feliz Cumpleaños'])
  })

  it('busca tambien en el nombre de la categoria', () => {
    expect(filtrarProductos(lista, { ...SIN_FILTROS, q: 'blonda' }).map((p) => p.nombre)).toEqual([
      'Base redonda',
    ])
  })

  it('combina familia y ocasion', () => {
    expect(filtrarProductos(lista, { familia: 'toppers', q: '', ocasion: 'Grado' })).toHaveLength(1)
    expect(
      filtrarProductos(lista, { familia: 'toppers', q: '', ocasion: 'Cumpleaños' })
    ).toHaveLength(0)
  })

  it('sin filtros devuelve todo en el mismo orden', () => {
    expect(filtrarProductos(lista, SIN_FILTROS)).toEqual(lista)
  })
})

describe('ordenarProductos', () => {
  const caro = producto({ nombre: 'Caro', precio: { unitario: 90000, escalas: [] } })
  const escala = producto({
    nombre: 'Escala',
    precio: {
      unitario: null,
      escalas: [
        { cantidadMinima: 100, precioUnitario: 1000 },
        { cantidadMinima: 12, precioUnitario: 3000 },
      ],
    },
  })
  const cotizar = producto({ nombre: 'Cotizar', precio: { unitario: null, escalas: [] } })
  const barato = producto({ nombre: 'Barato', precio: { unitario: 2000, escalas: [] } })
  const lista = [caro, cotizar, escala, barato]

  it('recomendados conserva el orden del taller', () => {
    expect(ordenarProductos(lista, 'recomendados')).toEqual(lista)
  })

  it('por precio usa el precio de entrada de la escala y deja "Te lo cotizamos" al final', () => {
    expect(ordenarProductos(lista, 'precio-asc').map((p) => p.nombre)).toEqual([
      'Barato',
      'Escala',
      'Caro',
      'Cotizar',
    ])
    expect(ordenarProductos(lista, 'precio-desc').map((p) => p.nombre)).toEqual([
      'Caro',
      'Escala',
      'Barato',
      'Cotizar',
    ])
  })

  it('por nombre ordena en español', () => {
    const nombres = [
      producto({ nombre: 'Ñandú' }),
      producto({ nombre: 'Árbol' }),
      producto({ nombre: 'Nube' }),
    ]
    expect(ordenarProductos(nombres, 'nombre').map((p) => p.nombre)).toEqual([
      'Árbol',
      'Nube',
      'Ñandú',
    ])
  })

  it('no muta la lista original', () => {
    const copia = [...lista]
    ordenarProductos(lista, 'precio-asc')
    expect(lista).toEqual(copia)
  })
})

describe('agruparPorFamilia', () => {
  it('agrupa en el orden del enum y omite familias vacias', () => {
    const grupos = agruparPorFamilia([
      producto({ nombre: 'a', familia: 'papeleria' }),
      producto({ nombre: 'b', familia: 'toppers' }),
      producto({ nombre: 'c', familia: 'papeleria' }),
    ])
    expect(grupos.map((g) => [g.familia, g.productos.length])).toEqual([
      ['toppers', 1],
      ['papeleria', 2],
    ])
  })
})
