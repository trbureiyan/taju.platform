import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { CatalogoPage } from './CatalogoPage'
import { useCatalogo } from '../hooks/useCatalogo'
import { producto } from '../test/productos'

vi.mock('../hooks/useCatalogo', () => ({ useCatalogo: vi.fn() }))

const CATALOGO = [
  producto({ nombre: 'Topper luna', familia: 'toppers', especificaciones: { ocasion: 'Grado' } }),
  producto({ nombre: 'Topper sol', familia: 'toppers' }),
  producto({ nombre: 'Blonda 22', familia: 'superficies' }),
  producto({ nombre: 'Invitación VIP', familia: 'papeleria' }),
]

function Ubicacion() {
  const { search } = useLocation()
  return <span data-testid="ubicacion">{search}</span>
}

function renderCatalogo(entrada = '/catalogo') {
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
    </MemoryRouter>
  )
}

const reintentar = vi.fn()
function catalogo(parcial: Partial<ReturnType<typeof useCatalogo>> = {}) {
  vi.mocked(useCatalogo).mockReturnValue({
    productos: CATALOGO,
    cargando: false,
    error: null,
    reintentar,
    ...parcial,
  })
}

describe('CatalogoPage', () => {
  beforeEach(() => {
    reintentar.mockClear()
    catalogo()
  })

  it('con "Todas" muestra un estante por familia con productos', () => {
    renderCatalogo()
    const estantes = screen.getAllByRole('region', {
      name: /^(Toppers|Superficies|Señalética|Papelería)$/,
    })
    expect(estantes.map((e) => e.getAttribute('aria-label'))).toEqual([
      'Toppers',
      'Superficies',
      'Papelería',
    ])
    expect(
      within(estantes[0]).getByRole('link', { name: /Ver los toppers \(2\)/ })
    ).toHaveAttribute('href', '/catalogo?familia=toppers')
  })

  it('una familia en la URL filtra, pinta su cabecera y marca su enlace', () => {
    renderCatalogo('/catalogo?familia=superficies')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Superficies')
    expect(screen.getByRole('link', { name: 'Superficies' })).toHaveAttribute(
      'aria-current',
      'page'
    )
    expect(screen.getAllByRole('article')).toHaveLength(1)
  })

  it('buscar junta los estantes en una grilla y actualiza el conteo', async () => {
    renderCatalogo()
    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar en el catálogo' }), 'topper')
    expect(screen.queryAllByRole('region', { name: 'Toppers' })).toHaveLength(0)
    expect(screen.getAllByRole('article')).toHaveLength(2)
    expect(screen.getByRole('status')).toHaveTextContent('2 productos')
    expect(screen.getByTestId('ubicacion')).toHaveTextContent('?q=topper')
  })

  it('ordenar escribe el orden en la URL', async () => {
    renderCatalogo()
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Ordenar' }), 'nombre')
    expect(screen.getByTestId('ubicacion')).toHaveTextContent('?orden=nombre')
  })

  it('sin resultados orienta y "Quitar los filtros" limpia la URL', async () => {
    renderCatalogo('/catalogo?q=zzz')
    expect(screen.getByText(/No encontramos productos con ese filtro/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Quitar los filtros' }))
    expect(screen.getByTestId('ubicacion')).toBeEmptyDOMElement()
  })

  it('en error ofrece "Probar de nuevo" sin voseo ni lenguaje de sistema', async () => {
    catalogo({ productos: [], error: 'caido' })
    renderCatalogo()
    const alerta = screen.getByRole('alert')
    expect(alerta).not.toHaveTextContent(/intentá|servidor/i)
    await userEvent.click(within(alerta).getByRole('button', { name: 'Probar de nuevo' }))
    expect(reintentar).toHaveBeenCalledOnce()
  })

  it('mientras carga usa EsperaTaller', () => {
    catalogo({ productos: [], cargando: true })
    renderCatalogo()
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
  })
})
