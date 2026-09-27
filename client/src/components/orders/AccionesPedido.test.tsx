import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AccionesPedido } from './AccionesPedido'

describe('AccionesPedido', () => {
  it('enlaza a pedir de nuevo y arma el mensaje de WhatsApp con codigo y producto', () => {
    render(
      <MemoryRouter>
        <AccionesPedido productoId="p1" pedidoId="abc123" nombreProducto="Topper luna" codigo="TJ-3F9A2C" />
      </MemoryRouter>,
    )

    const pedirDeNuevo = screen.getAllByRole('link', { name: /pedir de nuevo/i })[0]
    expect(pedirDeNuevo).toHaveAttribute('href', '/pedido/p1?desde=abc123')

    const whatsapp = screen.getAllByRole('link', { name: /escríbenos por este pedido/i })[0]
    expect(whatsapp.getAttribute('href')).toContain(encodeURIComponent('TJ-3F9A2C'))
    expect(whatsapp.getAttribute('href')).toContain(encodeURIComponent('Topper luna'))
  })
})
