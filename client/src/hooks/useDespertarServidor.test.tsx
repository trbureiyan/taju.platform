import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'

// el hook guarda una bandera a nivel de modulo: cada test importa una copia limpia
async function cargarHook() {
  vi.resetModules()
  return import('./useDespertarServidor')
}

describe('useDespertarServidor', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset().mockResolvedValue(new Response('{}'))
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('apunta a origen + /health, no a /api/health', async () => {
    const { urlSalud } = await cargarHook()
    expect(urlSalud('https://taju-server.onrender.com/api')).toBe('https://taju-server.onrender.com/health')
    expect(urlSalud('http://localhost:3001/api/')).toBe('http://localhost:3001/health')
  })

  it('dispara una sola vez por carga aunque se monte varias veces', async () => {
    const { useDespertarServidor } = await cargarHook()
    function Prueba() {
      useDespertarServidor('https://taju-server.onrender.com/api')
      return null
    }
    const { unmount } = render(<Prueba />)
    unmount()
    render(<Prueba />)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe('https://taju-server.onrender.com/health')
  })

  it('un fallo de red no lanza ni rompe el render', async () => {
    fetchMock.mockRejectedValue(new TypeError('network'))
    const { useDespertarServidor } = await cargarHook()
    function Prueba() {
      useDespertarServidor('https://taju-server.onrender.com/api')
      return <p>ok</p>
    }
    expect(() => render(<Prueba />)).not.toThrow()
    await Promise.resolve()
  })
})
