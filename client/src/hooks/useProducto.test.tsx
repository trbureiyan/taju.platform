import { describe, it, expect, vi, afterEach } from 'vitest'
import { createElement, type ReactNode } from 'react'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useProducto } from './useProducto'
import { api } from '../lib/api'
import { AuthProvider, useAuth } from '../contexts/AuthContext'
import { producto } from '../test/productos'

// el token vive en el modulo api: aca se simula con una variable que el AuthProvider real escribe al salir
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
  // mockReset y no clearAllMocks: una respuesta "Once" sin consumir no debe pasar al test siguiente
  getMock.mockReset()
  sesion.token = null
})

// la sesion se maneja desde un componente hermano, como Nav
function conNav() {
  const ref: { auth: ReturnType<typeof useAuth> | null } = { auth: null }
  function Nav() {
    ref.auth = useAuth()
    return null
  }
  const wrapper = ({ children }: { children: ReactNode }) => createElement(AuthProvider, null, createElement(Nav), children)
  return { ref, wrapper }
}

describe('useProducto | sesion', () => {
  it('logout descarta el producto que trajo la sesion de administrador', async () => {
    sesion.token = 'admin'
    getMock.mockResolvedValueOnce(producto({ _id: 'p1', nombre: 'inactivo' }))
    const { ref, wrapper } = conNav()
    const { result } = renderHook(() => useProducto('p1'), { wrapper })
    await waitFor(() => expect(result.current.producto?.nombre).toBe('inactivo'))

    getMock.mockReturnValueOnce(new Promise(() => {}))
    act(() => ref.auth!.logout())
    expect(result.current.producto).toBeNull()
    expect(result.current.estado).toBe('cargando')
    expect(getMock).toHaveBeenCalledTimes(2)
  })

  it('si tras el logout el refresco falla por red, no vuelve a mostrar el producto anterior', async () => {
    sesion.token = 'admin'
    getMock.mockResolvedValueOnce(producto({ _id: 'p1', nombre: 'inactivo' }))
    const { ref, wrapper } = conNav()
    const { result } = renderHook(() => useProducto('p1'), { wrapper })
    await waitFor(() => expect(result.current.estado).toBe('listo'))

    getMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    act(() => ref.auth!.logout())
    await waitFor(() => expect(result.current.estado).toBe('error'))
    expect(result.current.producto).toBeNull()
  })
})
