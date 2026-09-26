import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useFiltrosCatalogo } from './useFiltrosCatalogo'

function envolver(entrada: string) {
  return ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[entrada]}>{children}</MemoryRouter>
  )
}

function useConUbicacion() {
  const filtros = useFiltrosCatalogo()
  const { search } = useLocation()
  return { ...filtros, search }
}

describe('useFiltrosCatalogo', () => {
  it('lee los cuatro filtros de la URL', () => {
    const { result } = renderHook(useFiltrosCatalogo, {
      wrapper: envolver('/catalogo?familia=toppers&q=luna&orden=precio-asc&ocasion=Grado'),
    })
    expect(result.current).toMatchObject({
      familia: 'toppers',
      q: 'luna',
      orden: 'precio-asc',
      ocasion: 'Grado',
    })
    expect(result.current.hayFiltros).toBe(true)
  })

  it('valores invalidos caen al defecto', () => {
    const { result } = renderHook(useFiltrosCatalogo, {
      wrapper: envolver('/catalogo?familia=xyz&orden=raro'),
    })
    expect(result.current).toMatchObject({
      familia: null,
      q: '',
      orden: 'recomendados',
      ocasion: null,
    })
    expect(result.current.hayFiltros).toBe(false)
  })

  it('un orden con nombre de propiedad heredada cae al defecto', () => {
    for (const valor of ['constructor', 'toString', '__proto__']) {
      const { result } = renderHook(useFiltrosCatalogo, {
        wrapper: envolver(`/catalogo?orden=${valor}`),
      })
      expect(result.current.orden).toBe('recomendados')
    }
  })

  it('actualizar escribe en la URL y borra los valores por defecto', () => {
    const { result } = renderHook(useConUbicacion, { wrapper: envolver('/catalogo?orden=nombre') })
    act(() => result.current.actualizar({ q: 'topper', orden: 'recomendados' }))
    expect(result.current.search).toBe('?q=topper')
  })

  it('limpiar quita familia, busqueda y ocasion pero conserva el orden', () => {
    const { result } = renderHook(useConUbicacion, {
      wrapper: envolver('/catalogo?familia=toppers&q=a&ocasion=Grado&orden=nombre'),
    })
    act(() => result.current.limpiar())
    expect(result.current.search).toBe('?orden=nombre')
  })

  it('hrefFamilia arma el enlace de una familia conservando el resto', () => {
    const { result } = renderHook(useFiltrosCatalogo, {
      wrapper: envolver('/catalogo?q=a&familia=toppers'),
    })
    expect(result.current.hrefFamilia('papeleria')).toBe('/catalogo?q=a&familia=papeleria')
    expect(result.current.hrefFamilia(null)).toBe('/catalogo?q=a')
  })
})
