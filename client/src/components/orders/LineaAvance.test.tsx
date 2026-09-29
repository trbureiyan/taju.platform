import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LineaAvance } from './LineaAvance'

describe('LineaAvance', () => {
  it('dibuja seis tramos y dice en cual va', () => {
    render(<LineaAvance estado="en_produccion" />)
    expect(screen.getByRole('list', { name: 'Avance del pedido: 4 de 6' })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem', { hidden: true })).toHaveLength(6)
  })

  it('un pedido cancelado no dibuja nada: no avanza', () => {
    const { container } = render(<LineaAvance estado="cancelado" />)
    expect(container).toBeEmptyDOMElement()
  })
})
