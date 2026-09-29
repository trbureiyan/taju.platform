import { describe, it, expect, vi, afterEach } from 'vitest'
import { createElement, type ReactNode } from 'react'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useMisPedidos, olvidarMisPedidos, pedidoEnMemoria, actualizarEnMemoria } from './useMisPedidos'
import { api } from '../lib/api'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import { pedido } from '../test/pedidos'

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
const usarMisPedidos = () => renderHook(() => useMisPedidos(), { wrapper: conSesion })

afterEach(() => {
  vi.clearAllMocks()
  sesion.token = null
  olvidarMisPedidos()
})

describe('useMisPedidos', () => {
  it('trae la lista en una sola llamada', async () => {
    getMock.mockResolvedValueOnce([pedido({})])
    const { result } = usarMisPedidos()
    expect(result.current.cargando).toBe(true)
    await waitFor(() => expect(result.current.cargando).toBe(false))
    expect(getMock).toHaveBeenCalledExactlyOnceWith('/pedidos/mis-pedidos')
    expect(result.current.pedidos).toHaveLength(1)
    expect(result.current.error).toBeNull()
  })

  it('expone el error y reintentar vuelve a pedir', async () => {
    getMock.mockRejectedValueOnce(new Error('caido')).mockResolvedValueOnce([pedido({})])
    const { result } = usarMisPedidos()
    await waitFor(() => expect(result.current.error).toBe('caido'))

    act(() => result.current.reintentar())
    await waitFor(() => expect(result.current.pedidos).toHaveLength(1))
    expect(result.current.error).toBeNull()
  })
})

describe('useMisPedidos | cache por sesion', () => {
  it('al volver a montar arranca con la ultima lista y la refresca en segundo plano', async () => {
    getMock.mockResolvedValueOnce([pedido({ nombre: 'a' })])
    const primero = usarMisPedidos()
    await waitFor(() => expect(primero.result.current.cargando).toBe(false))
    primero.unmount()

    getMock.mockReturnValueOnce(new Promise(() => {}))
    const { result } = usarMisPedidos()
    expect(result.current.cargando).toBe(false)
    expect(result.current.pedidos.map((p) => p.producto.nombre)).toEqual(['a'])
  })

  it('logout descarta la lista sin esperar otro render', async () => {
    let auth: ReturnType<typeof useAuth> | null = null
    function Nav() {
      auth = useAuth()
      return null
    }
    const conNav = ({ children }: { children: ReactNode }) =>
      createElement(AuthProvider, null, createElement(Nav), children)

    sesion.token = 'cliente-1'
    getMock.mockResolvedValueOnce([pedido({})])
    const { result } = renderHook(() => useMisPedidos(), { wrapper: conNav })
    await waitFor(() => expect(result.current.pedidos).toHaveLength(1))

    getMock.mockReturnValueOnce(new Promise(() => {}))
    act(() => auth!.logout())
    expect(result.current.pedidos).toEqual([])
    expect(result.current.cargando).toBe(true)
  })
})

describe('pedidoEnMemoria', () => {
  it('devuelve el pedido si esta en la cache de esta sesion, undefined si no', async () => {
    getMock.mockResolvedValueOnce([pedido({ _id: 'abc' })])
    const { result } = usarMisPedidos()
    await waitFor(() => expect(result.current.cargando).toBe(false))

    expect(pedidoEnMemoria('abc')?._id).toBe('abc')
    expect(pedidoEnMemoria('otro')).toBeUndefined()
  })
})

describe('actualizarEnMemoria', () => {
  it('cambia el pedido en la lista de la sesion y pedidoEnMemoria lo devuelve actualizado', async () => {
    sesion.token = 'cliente-1'
    getMock.mockResolvedValueOnce([pedido({ _id: 'a', estado: 'recibido' }), pedido({ _id: 'b' })])
    const { result } = usarMisPedidos()
    await waitFor(() => expect(result.current.cargando).toBe(false))

    actualizarEnMemoria(pedido({ _id: 'a', estado: 'cancelado' }))

    expect(pedidoEnMemoria('a')?.estado).toBe('cancelado')
    expect(pedidoEnMemoria('b')?.estado).toBe('recibido')
  })

  it('no hace nada si la sesion cambio', async () => {
    sesion.token = 'cliente-1'
    getMock.mockResolvedValueOnce([pedido({ _id: 'a', estado: 'recibido' })])
    const { result } = usarMisPedidos()
    await waitFor(() => expect(result.current.cargando).toBe(false))

    sesion.token = 'cliente-2'
    actualizarEnMemoria(pedido({ _id: 'a', estado: 'cancelado' }))
    sesion.token = 'cliente-1'

    expect(pedidoEnMemoria('a')?.estado).toBe('recibido')
  })
})
