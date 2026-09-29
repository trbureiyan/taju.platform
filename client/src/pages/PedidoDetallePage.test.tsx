import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { PedidoDetallePage } from './PedidoDetallePage'
import { api, ErrorApi } from '../lib/api'
import { AuthProvider } from '../contexts/AuthContext'
import { SnackbarProvider } from '../components/ui/Snackbar'
import { olvidarMisPedidos } from '../hooks/useMisPedidos'
import { pedido } from '../test/pedidos'
import { codigoPedido } from '../lib/pedido'

vi.mock('../lib/api', async (original) => {
  const real = await original<typeof import('../lib/api')>()
  return { ...real, api: { get: vi.fn(), post: vi.fn() }, getToken: () => null, setToken: () => {} }
})
const getMock = vi.mocked(api.get)

afterEach(() => {
  vi.clearAllMocks()
  olvidarMisPedidos()
})

function renderizar(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/mis-pedidos/${id}`]}>
      <AuthProvider>
        <SnackbarProvider>
          <Routes>
            <Route path="/mis-pedidos/:id" element={<PedidoDetallePage />} />
          </Routes>
        </SnackbarProvider>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('PedidoDetallePage', () => {
  it('muestra el nombre, el codigo, la linea de tiempo y el mensaje de WhatsApp con el codigo', async () => {
    getMock.mockResolvedValueOnce(pedido({ _id: 'abc123', nombre: 'Topper luna', estado: 'confirmado' }))
    renderizar('abc123')

    await waitFor(() => expect(screen.getByText('Topper luna')).toBeInTheDocument())
    expect(screen.getAllByText(codigoPedido('abc123')).length).toBeGreaterThan(0)
    const whatsapp = screen.getAllByRole('link', { name: /escríbenos por este pedido/i })[0]
    expect(whatsapp.getAttribute('href')).toContain(encodeURIComponent(codigoPedido('abc123')))
  })

  it('un 404 muestra "No encontramos este pedido" con enlace a Mis pedidos', async () => {
    getMock.mockRejectedValueOnce(new ErrorApi('Pedido no encontrado', 404))
    renderizar('abc123')

    await waitFor(() => expect(screen.getByText(/no encontramos este pedido/i)).toBeInTheDocument())
    expect(screen.getByRole('link', { name: /mis pedidos/i })).toBeInTheDocument()
  })

  it('un error de red ofrece probar de nuevo', async () => {
    getMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    renderizar('abc123')

    await waitFor(() => expect(screen.getByRole('button', { name: /probar de nuevo/i })).toBeInTheDocument())
  })

  it('una solicitud recibida ofrece cancelar y muestra fecha pedida y entrega', async () => {
    getMock.mockResolvedValueOnce(pedido({ _id: 'abc123', estado: 'recibido' }))
    renderizar('abc123')

    expect((await screen.findAllByRole('button', { name: 'Cancelar mi solicitud' })).length).toBeGreaterThan(0)
    expect(screen.getByText(/fecha que pediste/i)).toBeInTheDocument()
    expect(screen.getByText('La recoges en el taller')).toBeInTheDocument()
  })

  // [Review Focus] un pedido cancelado se lee como cancelado y no ofrece cancelar de nuevo
  it('un pedido cancelado se lee como cancelado y no ofrece cancelar', async () => {
    getMock.mockResolvedValueOnce(pedido({ _id: 'abc123', estado: 'cancelado' }))
    renderizar('abc123')

    expect(await screen.findByText(/este pedido se canceló/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancelar mi solicitud' })).not.toBeInTheDocument()
  })
})
