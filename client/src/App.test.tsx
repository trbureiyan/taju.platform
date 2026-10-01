import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

// la Vitrina y el resto cargan datos: lo unico que importa aqui es que una ruta desconocida no queda vacia
vi.mock('./lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./lib/api')>()),
  api: { get: vi.fn().mockRejectedValue(new Error('sin red')), post: vi.fn(), postForm: vi.fn() },
}))

describe('App | rutas', () => {
  it('una ruta que no existe muestra "No encontramos esta página" y el menu sigue visible', async () => {
    window.history.pushState({}, '', '/ruta-que-no-existe')
    render(<App />)
    expect(await screen.findByRole('heading', { name: 'No encontramos esta página' })).toBeInTheDocument()
    expect(screen.getAllByRole('navigation').length).toBeGreaterThan(0)
  })
})
