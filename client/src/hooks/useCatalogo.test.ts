import { describe, it, expect, vi, afterEach } from 'vitest'
import { createElement, type ReactNode } from 'react'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useCatalogo, olvidarCatalogo } from './useCatalogo'
import { api } from '../lib/api'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import { producto } from '../test/productos'

// el token vive en el modulo api: aca se simula con una variable que el AuthProvider real escribe al entrar y salir
const sesion = vi.hoisted(() => ({ token: null as string | null }))
vi.mock('../lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn() },
  getToken: () => sesion.token,
  setToken: (token: string | null) => {
    sesion.token = token
  },
}))
const getMock = vi.mocked(api.get)

const conSesion = ({ children }: { children: ReactNode }) => createElement(AuthProvider, null, children)
const usarCatalogo = () => renderHook(() => useCatalogo(), { wrapper: conSesion })

afterEach(() => {
  vi.clearAllMocks()
  sesion.token = null
  olvidarCatalogo()
})

describe('useCatalogo', () => {
  it('trae todo el catalogo en una sola llamada', async () => {
    getMock.mockResolvedValueOnce([producto({})])
    const { result } = usarCatalogo()
    expect(result.current.cargando).toBe(true)
    await waitFor(() => expect(result.current.cargando).toBe(false))
    expect(getMock).toHaveBeenCalledExactlyOnceWith('/productos')
    expect(result.current.productos).toHaveLength(1)
    expect(result.current.error).toBeNull()
  })

  it('expone el error y reintentar vuelve a pedir', async () => {
    getMock.mockRejectedValueOnce(new Error('caido')).mockResolvedValueOnce([producto({})])
    const { result } = usarCatalogo()
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
    const primero = usarCatalogo()
    await waitFor(() => expect(primero.result.current.cargando).toBe(false))
    primero.unmount()

    getMock.mockReturnValueOnce(new Promise(() => {}))
    const { result } = usarCatalogo()
    expect(result.current.cargando).toBe(false)
    expect(result.current.productos.map((p) => p.nombre)).toEqual(['a'])
  })
})

// con sesion de administrador /productos trae tambien los inactivos: nada de eso puede sobrevivir al cierre de sesion
describe('useCatalogo | cache por sesion', () => {
  it('el catalogo de otra sesion no se muestra al volver a montar', async () => {
    sesion.token = 'admin'
    getMock.mockResolvedValueOnce([producto({ nombre: 'inactivo' })])
    const admin = usarCatalogo()
    await waitFor(() => expect(admin.result.current.cargando).toBe(false))
    admin.unmount()

    sesion.token = null
    getMock.mockReturnValueOnce(new Promise(() => {}))
    const { result } = usarCatalogo()
    expect(result.current.cargando).toBe(true)
    expect(result.current.productos).toEqual([])
  })

  it('una respuesta pedida con otra sesion no llena la cache', async () => {
    sesion.token = 'admin'
    let responder: (p: ReturnType<typeof producto>[]) => void = () => {}
    getMock.mockReturnValueOnce(new Promise((r) => (responder = r)))
    const admin = usarCatalogo()
    admin.unmount()

    sesion.token = null
    await act(async () => responder([producto({ nombre: 'inactivo' })]))

    getMock.mockReturnValueOnce(new Promise(() => {}))
    const { result } = usarCatalogo()
    expect(result.current.productos).toEqual([])
  })

  it('si la sesion cambia con la vista montada, descarta lo mostrado y vuelve a pedir', async () => {
    sesion.token = 'admin'
    getMock.mockResolvedValueOnce([producto({ nombre: 'inactivo' })])
    const { result, rerender } = usarCatalogo()
    await waitFor(() => expect(result.current.productos).toHaveLength(1))

    sesion.token = null
    getMock.mockResolvedValueOnce([producto({ nombre: 'publico' })])
    rerender()
    expect(result.current.productos).toEqual([])
    await waitFor(() => expect(result.current.productos.map((p) => p.nombre)).toEqual(['publico']))
    expect(getMock).toHaveBeenCalledTimes(2)
  })
})

describe('useCatalogo | cierre de sesion con la vista montada', () => {
  it('logout descarta el catalogo del administrador sin esperar otro render', async () => {
    // la sesion se maneja desde un componente hermano, como Nav: CatalogoPage no consume AuthContext por su cuenta
    let auth: ReturnType<typeof useAuth> | null = null
    function Nav() {
      auth = useAuth()
      return null
    }
    const conNav = ({ children }: { children: ReactNode }) =>
      createElement(AuthProvider, null, createElement(Nav), children)

    // la sesion de administrador ya esta abierta cuando se monta el catalogo
    sesion.token = 'admin'
    getMock.mockResolvedValueOnce([producto({ nombre: 'inactivo' })])
    const { result } = renderHook(() => useCatalogo(), { wrapper: conNav })
    await waitFor(() => expect(result.current.productos.map((p) => p.nombre)).toEqual(['inactivo']))

    getMock.mockReturnValueOnce(new Promise(() => {}))
    act(() => auth!.logout())
    expect(result.current.productos).toEqual([])
    expect(result.current.cargando).toBe(true)
  })
})

describe('useCatalogo | reintento con cache', () => {
  it('si el reintento falla y hay cache de esta sesion, muestra la cache y deja de cargar', async () => {
    getMock.mockRejectedValueOnce(new Error('caido'))
    const primero = usarCatalogo()
    await waitFor(() => expect(primero.result.current.error).toBe('caido'))

    // otra instancia (p. ej. "Mas de la familia") llena la cache mientras la primera muestra el error
    getMock.mockResolvedValueOnce([producto({ nombre: 'a' })])
    const segundo = usarCatalogo()
    await waitFor(() => expect(segundo.result.current.cargando).toBe(false))

    getMock.mockRejectedValueOnce(new Error('caido otra vez'))
    act(() => primero.result.current.reintentar())
    await waitFor(() => expect(primero.result.current.cargando).toBe(false))
    expect(primero.result.current.productos.map((p) => p.nombre)).toEqual(['a'])
    expect(primero.result.current.error).toBeNull()
  })
})
