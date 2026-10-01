import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorBoundary } from './ErrorBoundary'

function Bomba({ falla }: { falla: boolean }) {
  if (falla) throw new Error('boom')
  return <p>todo bien</p>
}

// jsdom reporta el error lanzado al renderizar como "uncaught" y ensucia la salida: se marca como atendido
const atender = (e: ErrorEvent) => e.preventDefault()
beforeEach(() => window.addEventListener('error', atender))

afterEach(() => {
  window.removeEventListener('error', atender)
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('ErrorBoundary', () => {
  it('si un hijo lanza al renderizar, muestra un mensaje con salidas en lugar de una pantalla en blanco', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <ErrorBoundary resetKey="/a">
        <Bomba falla />
      </ErrorBoundary>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Algo salió mal en esta pantalla')
    expect(screen.getByRole('button', { name: 'Recargar la página' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ir al inicio' })).toHaveAttribute('href', '/')
  })

  it('al cambiar resetKey (otra ruta) se recupera y vuelve a pintar a los hijos', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { rerender } = render(
      <ErrorBoundary resetKey="/a">
        <Bomba falla />
      </ErrorBoundary>,
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()
    rerender(
      <ErrorBoundary resetKey="/b">
        <Bomba falla={false} />
      </ErrorBoundary>,
    )
    expect(screen.getByText('todo bien')).toBeInTheDocument()
  })

  it('Recargar la pagina recarga el navegador', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const recargar = vi.fn()
    vi.stubGlobal('location', { ...window.location, reload: recargar })
    render(
      <ErrorBoundary resetKey="/a">
        <Bomba falla />
      </ErrorBoundary>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Recargar la página' }))
    expect(recargar).toHaveBeenCalled()
  })
})
