import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

// la Vitrina y el resto cargan datos: lo unico que importa aqui es que una ruta desconocida no queda vacia
vi.mock('./lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./lib/api')>()),
  api: { get: vi.fn().mockRejectedValue(new Error('sin red')), post: vi.fn(), postForm: vi.fn() },
}))

// una pagina que lanza al renderizar: sin ErrorBoundary esto desmontaba toda la app y dejaba la pantalla en blanco
vi.mock('./pages/CatalogoPage', () => ({
  CatalogoPage: () => {
    throw new Error('boom')
  },
}))

// jsdom reporta el error lanzado al renderizar como "uncaught" y ensucia la salida
const atender = (e: ErrorEvent) => e.preventDefault()
beforeEach(() => window.addEventListener('error', atender))
afterEach(() => window.removeEventListener('error', atender))

describe('App | rutas', () => {
  it('si una pagina falla al renderizar, se ve un aviso con salidas y el menu sigue visible', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    window.history.pushState({}, '', '/catalogo')
    render(<App />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Algo salió mal en esta pantalla')
    expect(screen.getAllByRole('navigation').length).toBeGreaterThan(0)
    vi.restoreAllMocks()
  })

  it('una ruta que no existe muestra "No encontramos esta página" y el menu sigue visible', async () => {
    window.history.pushState({}, '', '/ruta-que-no-existe')
    render(<App />)
    expect(await screen.findByRole('heading', { name: 'No encontramos esta página' })).toBeInTheDocument()
    expect(screen.getAllByRole('navigation').length).toBeGreaterThan(0)
  })
})
