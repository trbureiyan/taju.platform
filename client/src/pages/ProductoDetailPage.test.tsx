import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ProductoDetailPage } from './ProductoDetailPage'
import { api, ErrorApi } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { producto } from '../test/productos'
import { olvidarCatalogo } from '../hooks/useCatalogo'
import type { Producto } from '../types'

vi.mock('../lib/api', async (original) => {
  const real = await original<typeof import('../lib/api')>()
  return { ...real, api: { get: vi.fn() } }
})
vi.mock('../contexts/AuthContext', () => ({ useAuth: vi.fn() }))
const getMock = vi.mocked(api.get)

const topper: Producto = {
  ...producto({
    _id: 't1',
    nombre: 'Topper luna',
    familia: 'toppers',
    especificaciones: { ocasion: 'Grado', grosor_mm: '3' },
  }),
  categoria: {
    _id: 'c',
    nombre: 'Toppers acrílicos',
    familia: 'toppers',
    dimensionesBase: [{ etiqueta: 'Media libra', valor: 22, unidad: 'cm' }],
  },
}

function renderDetalle(estado?: { producto: Producto }) {
  render(
    <MemoryRouter initialEntries={[{ pathname: '/catalogo/t1', state: estado }]}>
      <Routes>
        <Route path="/catalogo/:id" element={<ProductoDetailPage />} />
        <Route path="/login" element={<p>login</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProductoDetailPage', () => {
  beforeEach(() => {
    olvidarCatalogo()
    getMock.mockReset()
    vi.mocked(useAuth).mockReturnValue({
      usuario: null,
      autenticado: false,
      login: vi.fn(),
      registrar: vi.fn(),
      logout: vi.fn(),
    })
  })

  it('con el producto de la tarjeta se pinta al instante, sin esperar a la API', () => {
    getMock.mockReturnValue(new Promise(() => {}))
    renderDetalle({ producto: topper })
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Topper luna')
    expect(getMock).toHaveBeenCalledWith('/productos/t1')
  })

  it('entrando por enlace directo espera a la API', async () => {
    getMock.mockImplementation((path: string) => Promise.resolve(path === '/productos' ? [] : topper))
    renderDetalle()
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument()
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Topper luna')
  })

  it('un 404 dice que el producto no esta, con enlace al catalogo', async () => {
    getMock.mockRejectedValue(new ErrorApi('No existe', 404))
    renderDetalle()
    expect(await screen.findByText(/No encontramos este producto/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver al catálogo' })).toHaveAttribute('href', '/catalogo')
  })

  it('una caida de red ofrece probar de nuevo', async () => {
    let intentos = 0
    getMock.mockImplementation((path: string) => {
      // "Mas toppers" pide el catalogo aparte; el producto falla la primera vez y responde la segunda
      if (path === '/productos') return Promise.resolve([])
      intentos += 1
      return intentos === 1 ? Promise.reject(new TypeError('Failed to fetch')) : Promise.resolve(topper)
    })
    renderDetalle()
    await userEvent.click(await screen.findByRole('button', { name: 'Probar de nuevo' }))
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Topper luna')
  })

  it('muestra todas las escalas para el cliente profesional', async () => {
    const blonda = producto({
      _id: 't1',
      familia: 'superficies',
      precio: {
        unitario: null,
        escalas: [
          { cantidadMinima: 100, precioUnitario: 1900 },
          { cantidadMinima: 12, precioUnitario: 2500 },
        ],
      },
    })
    getMock.mockReturnValue(new Promise(() => {}))
    renderDetalle({ producto: blonda })
    const tabla = screen.getByRole('table', { name: 'Precios por cantidad' })
    const filas = within(tabla).getAllByRole('row').slice(1)
    expect(filas.map((f) => f.textContent)).toEqual(['Desde 12 unidades$2.500 c/u', 'Desde 100 unidades$1.900 c/u'])
  })

  it('antes de pedir, especificaciones legibles y medida como referencia de torta', () => {
    getMock.mockReturnValue(new Promise(() => {}))
    renderDetalle({ producto: topper })
    expect(screen.getByRole('region', { name: 'Antes de pedir' })).toHaveTextContent('El diámetro de tu torta')
    expect(screen.getByText('Ocasión')).toBeInTheDocument()
    expect(screen.getByText('Grosor mm')).toBeInTheDocument()
    expect(screen.getByText('22 cm, torta de media libra')).toBeInTheDocument()
  })

  it('"Empezar mi pedido" sin sesion lleva a ingresar y vuelve al pedido', async () => {
    getMock.mockReturnValue(new Promise(() => {}))
    renderDetalle({ producto: topper })
    await userEvent.click(screen.getAllByRole('button', { name: 'Empezar mi pedido' })[0])
    expect(screen.getByText('login')).toBeInTheDocument()
  })

  it('el WhatsApp del detalle lleva el nombre del producto', () => {
    getMock.mockReturnValue(new Promise(() => {}))
    renderDetalle({ producto: topper })
    const enlace = screen.getByRole('link', { name: /Pregúntanos por WhatsApp/ })
    expect(decodeURIComponent(enlace.getAttribute('href') ?? '')).toContain('Topper luna')
  })
})
