import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useCatalogo, olvidarCatalogo } from './useCatalogo'
import { api } from '../lib/api'
import { producto } from '../test/productos'

vi.mock('../lib/api', () => ({ api: { get: vi.fn() } }))
const getMock = vi.mocked(api.get)

afterEach(() => {
  vi.clearAllMocks()
  olvidarCatalogo()
})

describe('useCatalogo', () => {
  it('trae todo el catalogo en una sola llamada', async () => {
    getMock.mockResolvedValueOnce([producto({})])
    const { result } = renderHook(() => useCatalogo())
    expect(result.current.cargando).toBe(true)
    await waitFor(() => expect(result.current.cargando).toBe(false))
    expect(getMock).toHaveBeenCalledExactlyOnceWith('/productos')
    expect(result.current.productos).toHaveLength(1)
    expect(result.current.error).toBeNull()
  })

  it('expone el error y reintentar vuelve a pedir', async () => {
    getMock.mockRejectedValueOnce(new Error('caido')).mockResolvedValueOnce([producto({})])
    const { result } = renderHook(() => useCatalogo())
    await waitFor(() => expect(result.current.error).toBe('caido'))

    act(() => result.current.reintentar())
    await waitFor(() => expect(result.current.productos).toHaveLength(1))
    expect(result.current.error).toBeNull()
    expect(getMock).toHaveBeenCalledTimes(2)
  })
})

describe('useCatalogo | cache', () => {
  it('al volver a montar arranca con el ultimo catalogo y lo refresca en segundo plano', async () => {
    getMock.mockResolvedValueOnce([producto({ nombre: 'a' })])
    const primero = renderHook(() => useCatalogo())
    await waitFor(() => expect(primero.result.current.cargando).toBe(false))
    primero.unmount()

    getMock.mockReturnValueOnce(new Promise(() => {}))
    const { result } = renderHook(() => useCatalogo())
    expect(result.current.cargando).toBe(false)
    expect(result.current.productos.map((p) => p.nombre)).toEqual(['a'])
  })
})
