import { describe, it, expect, vi, afterEach } from 'vitest'
import { createElement, type ReactNode } from 'react'
import { renderHook, waitFor, act } from '@testing-library/react'
import { usePedido } from './usePedido'
import { useMisPedidos, pedidoEnMemoria, olvidarMisPedidos } from './useMisPedidos'
import { api, ErrorApi } from '../lib/api'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import { pedido, antiguo } from '../test/pedidos'

const sesion = vi.hoisted(() => ({ token: null as string | null }))
vi.mock('../lib/api', async (original) => {
  const real = await original<typeof import('../lib/api')>()
  return {
    ...real,
    api: { get: vi.fn(), post: vi.fn() },
    getToken: () => sesion.token,
    setToken: (token: string | null) => {
      sesion.token = token
    },
  }
})
const getMock = vi.mocked(api.get)

afterEach(() => {
  getMock.mockReset()
  sesion.token = null
})

function conNav() {
  const ref: { auth: ReturnType<typeof useAuth> | null } = { auth: null }
  function Nav() {
    ref.auth = useAuth()
    return null
  }
  const wrapper = ({ children }: { children: ReactNode }) => createElement(AuthProvider, null, createElement(Nav), children)
  return { ref, wrapper }
}

describe('usePedido', () => {
  it('arranca desde el pedido inicial y lo confirma con la respuesta del server', async () => {
    const { wrapper } = conNav()
    getMock.mockResolvedValueOnce(pedido({ _id: 'p1' }))
    const { result } = renderHook(() => usePedido('p1', pedido({ _id: 'p1' })), { wrapper })
    expect(result.current.estado).toBe('listo')
    await waitFor(() => expect(getMock).toHaveBeenCalledWith('/pedidos/p1'))
  })

  it('completa un pedido con forma antigua que llega del server', async () => {
    const { wrapper } = conNav()
    getMock.mockResolvedValueOnce(antiguo(pedido({ _id: 'p1' })))
    const { result } = renderHook(() => usePedido('p1'), { wrapper })
    await waitFor(() => expect(result.current.estado).toBe('listo'))
    expect(result.current.pedido?.contacto).toEqual({ nombre: '', telefono: '' })
    expect(result.current.pedido?.entrega).toEqual({ metodo: 'recoger', detalle: '' })
  })

  it('un 404 marca no-encontrado (pedido inexistente o de otro cliente)', async () => {
    const { wrapper } = conNav()
    getMock.mockRejectedValueOnce(new ErrorApi('Pedido no encontrado', 404))
    const { result } = renderHook(() => usePedido('p1'), { wrapper })
    await waitFor(() => expect(result.current.estado).toBe('no-encontrado'))
  })

  it('un error de red no pisa el pedido ya pintado', async () => {
    const { wrapper } = conNav()
    getMock.mockResolvedValueOnce(pedido({ _id: 'p1' }))
    const { result } = renderHook(() => usePedido('p1'), { wrapper })
    await waitFor(() => expect(result.current.estado).toBe('listo'))

    getMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    act(() => result.current.reintentar())
    await waitFor(() => expect(result.current.estado).toBe('error'))
    expect(result.current.pedido).not.toBeNull()
  })

  it('logout descarta el pedido de la sesion anterior', async () => {
    sesion.token = 'cliente-1'
    getMock.mockResolvedValueOnce(pedido({ _id: 'p1' }))
    const { ref, wrapper } = conNav()
    const { result } = renderHook(() => usePedido('p1'), { wrapper })
    await waitFor(() => expect(result.current.estado).toBe('listo'))

    getMock.mockReturnValueOnce(new Promise(() => {}))
    act(() => ref.auth!.logout())
    expect(result.current.pedido).toBeNull()
    expect(result.current.estado).toBe('cargando')
  })

  it('reemplazar pinta el pedido que devolvio el server sin volver a pedirlo', async () => {
    const { wrapper } = conNav()
    getMock.mockResolvedValueOnce(pedido({ _id: 'p1', estado: 'recibido' }))
    const { result } = renderHook(() => usePedido('p1'), { wrapper })
    await waitFor(() => expect(result.current.estado).toBe('listo'))

    act(() => result.current.reemplazar(pedido({ _id: 'p1', estado: 'cancelado' })))

    expect(result.current.pedido?.estado).toBe('cancelado')
    expect(getMock).toHaveBeenCalledTimes(1)
  })

  it('reemplazar tambien actualiza la lista en memoria de Mis pedidos', async () => {
    const { wrapper } = conNav()
    getMock.mockResolvedValueOnce([pedido({ _id: 'p1', estado: 'recibido' })])
    const lista = renderHook(() => useMisPedidos(), { wrapper })
    await waitFor(() => expect(lista.result.current.cargando).toBe(false))

    getMock.mockResolvedValueOnce(pedido({ _id: 'p1', estado: 'recibido' }))
    const { result } = renderHook(() => usePedido('p1', pedidoEnMemoria('p1')), { wrapper })
    await waitFor(() => expect(result.current.estado).toBe('listo'))
    act(() => result.current.reemplazar(pedido({ _id: 'p1', estado: 'cancelado' })))

    expect(pedidoEnMemoria('p1')?.estado).toBe('cancelado')
    olvidarMisPedidos()
  })
})
