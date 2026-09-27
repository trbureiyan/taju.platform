import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useCatalogo, olvidarCatalogo } from './useCatalogo'
import { api, getToken } from '../lib/api'
import { producto } from '../test/productos'

vi.mock('../lib/api', () => ({ api: { get: vi.fn() }, getToken: vi.fn(() => null) }))
const getMock = vi.mocked(api.get)
const tokenMock = vi.mocked(getToken)

afterEach(() => {
  vi.clearAllMocks()
  tokenMock.mockReturnValue(null)
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

// con sesion de administrador /productos trae tambien los inactivos: nada de eso puede sobrevivir al cierre de sesion
describe('useCatalogo | cache por sesion', () => {
  it('el catalogo de otra sesion no se muestra al volver a montar', async () => {
    tokenMock.mockReturnValue('admin')
    getMock.mockResolvedValueOnce([producto({ nombre: 'inactivo' })])
    const admin = renderHook(() => useCatalogo())
    await waitFor(() => expect(admin.result.current.cargando).toBe(false))
    admin.unmount()

    tokenMock.mockReturnValue(null)
    getMock.mockReturnValueOnce(new Promise(() => {}))
    const { result } = renderHook(() => useCatalogo())
    expect(result.current.cargando).toBe(true)
    expect(result.current.productos).toEqual([])
  })

  it('una respuesta pedida con otra sesion no llena la cache', async () => {
    tokenMock.mockReturnValue('admin')
    let responder: (p: ReturnType<typeof producto>[]) => void = () => {}
    getMock.mockReturnValueOnce(new Promise((r) => (responder = r)))
    const admin = renderHook(() => useCatalogo())
    admin.unmount()

    tokenMock.mockReturnValue(null)
    await act(async () => responder([producto({ nombre: 'inactivo' })]))

    getMock.mockReturnValueOnce(new Promise(() => {}))
    const { result } = renderHook(() => useCatalogo())
    expect(result.current.productos).toEqual([])
  })

  it('si la sesion cambia con la vista montada, descarta lo mostrado y vuelve a pedir', async () => {
    tokenMock.mockReturnValue('admin')
    getMock.mockResolvedValueOnce([producto({ nombre: 'inactivo' })])
    const { result, rerender } = renderHook(() => useCatalogo())
    await waitFor(() => expect(result.current.productos).toHaveLength(1))

    tokenMock.mockReturnValue(null)
    getMock.mockResolvedValueOnce([producto({ nombre: 'publico' })])
    rerender()
    expect(result.current.productos).toEqual([])
    await waitFor(() => expect(result.current.productos.map((p) => p.nombre)).toEqual(['publico']))
    expect(getMock).toHaveBeenCalledTimes(2)
  })
})
