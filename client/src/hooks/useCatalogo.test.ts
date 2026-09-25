import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useCatalogo } from './useCatalogo'
import { api } from '../lib/api'
import type { Producto } from '../types'

vi.mock('../lib/api', () => ({
  api: { get: vi.fn() },
}))

const getMock = vi.mocked(api.get)

function producto(overrides: Partial<Producto> = {}): Producto {
  return {
    _id: 'p1',
    nombre: 'Topper corazon',
    descripcionTecnica: 'MDF 3mm',
    categoria: { _id: 'c1', nombre: 'Toppers redondos', familia: 'toppers', dimensionesBase: [] },
    especificacionesTecnicas: {},
    imagenes: [],
    precio: { unitario: 15000, escalas: [] },
    activo: true,
    ...overrides,
  }
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('useCatalogo', () => {
  it('arranca cargando y expone los productos cuando resuelve', async () => {
    getMock.mockResolvedValueOnce([producto()])

    const { result } = renderHook(() => useCatalogo(null))

    expect(result.current.cargando).toBe(true)
    expect(result.current.productos).toEqual([])

    await waitFor(() => expect(result.current.cargando).toBe(false))
    expect(result.current.productos).toHaveLength(1)
    expect(result.current.error).toBeNull()
  })

  it('sin familia pide /productos', async () => {
    getMock.mockResolvedValueOnce([])
    renderHook(() => useCatalogo(null))
    await waitFor(() => expect(getMock).toHaveBeenCalledWith('/productos'))
  })

  it('con familia filtra en el path del pedido al server', async () => {
    getMock.mockResolvedValueOnce([])
    renderHook(() => useCatalogo('toppers'))
    await waitFor(() => expect(getMock).toHaveBeenCalledWith('/productos?familia=toppers'))
  })

  it('vuelve a pedir cuando cambia la familia seleccionada', async () => {
    getMock.mockResolvedValue([])
    const { rerender } = renderHook(({ familia }) => useCatalogo(familia), {
      initialProps: { familia: null as Producto['categoria']['familia'] | null },
    })
    await waitFor(() => expect(getMock).toHaveBeenCalledWith('/productos'))

    rerender({ familia: 'senaletica' })
    await waitFor(() => expect(getMock).toHaveBeenCalledWith('/productos?familia=senaletica'))
  })

  it('expone el mensaje de error cuando el request falla', async () => {
    getMock.mockRejectedValueOnce(new Error('Error 500'))

    const { result } = renderHook(() => useCatalogo(null))

    await waitFor(() => expect(result.current.cargando).toBe(false))
    expect(result.current.error).toBe('Error 500')
    expect(result.current.productos).toEqual([])
  })
})
