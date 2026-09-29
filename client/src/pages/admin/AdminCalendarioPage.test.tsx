import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AdminCalendarioPage } from './AdminCalendarioPage'
import { api } from '../../lib/api'
import { pedidoAdmin } from '../../test/pedidos'

vi.mock('../../lib/api', () => ({ api: { get: vi.fn() } }))

afterEach(() => vi.clearAllMocks())

describe('AdminCalendarioPage', () => {
  it('un pedido cancelado no ocupa lugar en el calendario', async () => {
    vi.mocked(api.get).mockResolvedValueOnce([
      pedidoAdmin({ _id: 'aaa111', estado: 'cancelado', fechaEntrega: '2026-10-07T15:00:00.000Z' }),
    ])
    render(<AdminCalendarioPage />)

    expect(await screen.findByText('No hay pedidos activos.')).toBeInTheDocument()
  })

  it('la semana va de lunes a domingo', async () => {
    // miercoles 7 de octubre: su semana es del lunes 5 al domingo 11
    vi.mocked(api.get).mockResolvedValueOnce([
      pedidoAdmin({ _id: 'aaa111', estado: 'confirmado', fechaEntrega: '2026-10-07T15:00:00.000Z' }),
    ])
    render(<AdminCalendarioPage />)

    expect(await screen.findByRole('heading', { name: /semana del 5 .*oct.* – 11 .*oct/i })).toBeInTheDocument()
  })

  it('si la lista no carga, explica que hacer sin mostrar el error crudo', async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new TypeError('Failed to fetch'))
    render(<AdminCalendarioPage />)

    expect(await screen.findByRole('alert')).toHaveTextContent(/no pudimos cargar los pedidos/i)
    expect(screen.queryByText(/failed to fetch/i)).not.toBeInTheDocument()
  })
})
