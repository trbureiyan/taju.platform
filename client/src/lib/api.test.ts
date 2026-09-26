import { describe, it, expect, vi, afterEach } from 'vitest'
import { api, ErrorApi } from './api'

describe('api | errores', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('un 404 lanza ErrorApi con el codigo de estado y el mensaje del servidor', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'No existe' }), { status: 404 })))
    const error = await api.get('/productos/x').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ErrorApi)
    expect(error).toMatchObject({ estado: 404, message: 'No existe' })
  })

  it('una caida de red no es ErrorApi: no hubo respuesta del servidor', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    const error = await api.get('/productos').catch((e: unknown) => e)
    expect(error).not.toBeInstanceOf(ErrorApi)
  })
})
