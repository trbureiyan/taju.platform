import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AdminPedidosPage } from './AdminPedidosPage'
import { api } from '../../lib/api'
import { pedido } from '../../test/pedidos'
import { codigoPedido } from '../../lib/pedido'
import type { PedidoAdmin } from '../../types'

vi.mock('../../lib/api', () => ({ api: { get: vi.fn(), patch: vi.fn() } }))

afterEach(() => vi.clearAllMocks())

describe('AdminPedidosPage', () => {
  it('muestra la columna Código con el mismo codigo que ve el cliente', async () => {
    const p = { ...pedido({ _id: 'abc123' }), cliente: { _id: 'c1', email: 'laura@taju.co' } } as PedidoAdmin
    vi.mocked(api.get).mockResolvedValueOnce([p])
    render(<AdminPedidosPage />)

    await waitFor(() => expect(screen.getByText('Código')).toBeInTheDocument())
    expect(screen.getByText(codigoPedido('abc123'))).toBeInTheDocument()
  })
})
