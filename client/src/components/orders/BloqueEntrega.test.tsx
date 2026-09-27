import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BloqueEntrega } from './BloqueEntrega'

describe('BloqueEntrega', () => {
  it('con fecha, dice "Entrega prevista"', () => {
    render(<BloqueEntrega fechaEntrega="2026-10-18T12:00:00.000Z" />)
    expect(screen.getByText(/entrega prevista/i)).toBeInTheDocument()
    expect(screen.getByText(/18 de octubre/i)).toBeInTheDocument()
  })

  it('sin fecha, dice que se confirma por WhatsApp', () => {
    render(<BloqueEntrega fechaEntrega={null} />)
    expect(screen.getByText(/te confirmamos la fecha por whatsapp/i)).toBeInTheDocument()
  })
})
