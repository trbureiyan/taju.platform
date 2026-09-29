import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { TarjetaPedido } from './TarjetaPedido'
import { pedido } from '../../test/pedidos'
import { codigoPedido } from '../../lib/pedido'

function renderizar(p: ReturnType<typeof pedido>) {
  return render(
    <MemoryRouter>
      <TarjetaPedido pedido={p} />
    </MemoryRouter>,
  )
}

describe('TarjetaPedido', () => {
  it('muestra el nombre del producto, el codigo y el estado, con un solo enlace al detalle', () => {
    const p = pedido({ _id: 'abc123', nombre: 'Topper luna', estado: 'en_produccion' })
    renderizar(p)

    expect(screen.getByText('Topper luna')).toBeInTheDocument()
    expect(screen.getByText(codigoPedido('abc123'))).toBeInTheDocument()
    expect(screen.getByText('En producción')).toBeInTheDocument()
    const enlaces = screen.getAllByRole('link')
    expect(enlaces).toHaveLength(1)
    expect(enlaces[0]).toHaveAttribute('href', '/mis-pedidos/abc123')
  })

  it('muestra la fecha de entrega si existe, si no el siguiente paso', () => {
    const conFecha = pedido({ fechaEntrega: '2026-10-18T12:00:00.000Z' })
    const { unmount } = renderizar(conFecha)
    expect(screen.getByText(/entrega/i)).toBeInTheDocument()
    unmount()

    const sinFecha = pedido({ estado: 'recibido', fechaEntrega: null })
    renderizar(sinFecha)
    expect(screen.getByText(/recibimos tu solicitud/i)).toBeInTheDocument()
  })

  // [Review Focus] un pedido cancelado no promete fecha aunque el taller la hubiera acordado
  it('un pedido cancelado con fecha acordada dice que se cancelo y no promete entrega', () => {
    renderizar(pedido({ estado: 'cancelado', fechaEntrega: '2026-10-18T12:00:00.000Z' }))
    expect(screen.getByText(/este pedido se canceló/i)).toBeInTheDocument()
    expect(screen.queryByText(/te lo entregamos/i)).not.toBeInTheDocument()
  })
})
