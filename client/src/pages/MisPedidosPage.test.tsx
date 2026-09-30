import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { MisPedidosPage } from './MisPedidosPage'
import { api } from '../lib/api'
import { AuthProvider } from '../contexts/AuthContext'
import { olvidarMisPedidos, actualizarEnMemoria } from '../hooks/useMisPedidos'
import { pedido } from '../test/pedidos'

vi.mock('../lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn() },
  getToken: () => null,
  setToken: () => {},
}))
const getMock = vi.mocked(api.get)

afterEach(() => {
  vi.clearAllMocks()
  olvidarMisPedidos()
})

function renderizar() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <MisPedidosPage />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('MisPedidosPage', () => {
  it('muestra el resumen y separa en curso de anteriores, con los cancelados entre ellos', async () => {
    getMock.mockResolvedValueOnce([
      pedido({ _id: 'a', nombre: 'Topper luna', estado: 'en_produccion' }),
      pedido({ _id: 'b', nombre: 'Blonda grabada', estado: 'entregado' }),
      pedido({ _id: 'c', nombre: 'Invitación bordada', estado: 'cancelado' }),
    ])
    renderizar()

    await waitFor(() => expect(screen.getByText('Topper luna')).toBeInTheDocument())
    expect(screen.getByText('Tienes 1 pedido en camino')).toBeInTheDocument()
    expect(screen.getByText('Anteriores')).toBeInTheDocument()
    expect(screen.getByText('Blonda grabada')).toBeInTheDocument()
    expect(screen.getByText('Invitación bordada')).toBeInTheDocument()
  })

  it('con un pedido cancelado en memoria no lo cuenta como en camino', async () => {
    getMock.mockResolvedValueOnce([pedido({ _id: 'a', nombre: 'Topper luna', estado: 'recibido' })])
    const primera = renderizar()
    await waitFor(() => expect(screen.getByText('Tienes 1 pedido en camino')).toBeInTheDocument())
    primera.unmount()

    actualizarEnMemoria(pedido({ _id: 'a', nombre: 'Topper luna', estado: 'cancelado' }))
    getMock.mockReturnValueOnce(new Promise(() => {}))
    renderizar()

    expect(screen.getByText('Topper luna')).toBeInTheDocument()
    expect(screen.queryByText(/en camino/i)).not.toBeInTheDocument()
    expect(screen.getByText('Anteriores')).toBeInTheDocument()
  })

  it('el vacio tutea y enlaza al catalogo', async () => {
    getMock.mockResolvedValueOnce([])
    renderizar()
    await waitFor(() => expect(screen.getByText(/aún no tienes pedidos/i)).toBeInTheDocument())
    expect(screen.getByRole('link', { name: /explorar el catálogo/i })).toBeInTheDocument()
  })

  it('el error ofrece probar de nuevo', async () => {
    getMock.mockRejectedValueOnce(new Error('caido'))
    renderizar()
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /probar de nuevo/i })).toBeInTheDocument()
  })
})
