import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { CatalogoPage } from './CatalogoPage'
import { useCatalogo } from '../hooks/useCatalogo'

vi.mock('../hooks/useCatalogo', () => ({ useCatalogo: vi.fn() }))

function Ubicacion() {
  const { search } = useLocation()
  return <span data-testid="ubicacion">{search}</span>
}

function renderCatalogo(entrada: string) {
  render(
    <MemoryRouter initialEntries={[entrada]}>
      <Routes>
        <Route
          path="/catalogo"
          element={
            <>
              <CatalogoPage />
              <Ubicacion />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('CatalogoPage | familia en la URL', () => {
  beforeEach(() => {
    vi.mocked(useCatalogo).mockReturnValue({ productos: [], cargando: false, error: null })
  })

  it('lee ?familia= al cargar y filtra por esa familia', () => {
    renderCatalogo('/catalogo?familia=superficies')
    expect(useCatalogo).toHaveBeenLastCalledWith('superficies')
    expect(screen.getByRole('button', { name: 'Superficies' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('un valor invalido cae a "Todos"', () => {
    renderCatalogo('/catalogo?familia=xyz')
    expect(useCatalogo).toHaveBeenLastCalledWith(null)
    expect(screen.getByRole('button', { name: 'Todos' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('cambiar el filtro escribe la familia en la URL', async () => {
    renderCatalogo('/catalogo')
    await userEvent.click(screen.getByRole('button', { name: 'Papelería' }))
    expect(screen.getByTestId('ubicacion')).toHaveTextContent('?familia=papeleria')
    expect(useCatalogo).toHaveBeenLastCalledWith('papeleria')
  })

  it('"Todos" quita la familia de la URL', async () => {
    renderCatalogo('/catalogo?familia=toppers')
    await userEvent.click(screen.getByRole('button', { name: 'Todos' }))
    expect(screen.getByTestId('ubicacion')).toBeEmptyDOMElement()
  })

  it('el mensaje de error tutea y no expone lenguaje de sistema', () => {
    vi.mocked(useCatalogo).mockReturnValue({ productos: [], cargando: false, error: 'boom' })
    renderCatalogo('/catalogo')
    const alerta = screen.getByRole('alert')
    expect(alerta).not.toHaveTextContent(/intentá|servidor/i)
  })
})

describe('CatalogoPage | espera', () => {
  it('mientras carga usa EsperaTaller (region de estado)', () => {
    vi.mocked(useCatalogo).mockReturnValue({ productos: [], cargando: true, error: null })
    renderCatalogo('/catalogo')
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByText('Cargando productos...')).not.toBeInTheDocument()
  })
})
