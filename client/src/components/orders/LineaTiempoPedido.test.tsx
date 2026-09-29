import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LineaTiempoPedido } from './LineaTiempoPedido'
import type { HistorialEstadoPedido } from '../../types'

const historial: HistorialEstadoPedido[] = [
  { estadoAnterior: null, estadoNuevo: 'recibido', fecha: '2026-09-10T12:00:00.000Z' },
  { estadoAnterior: 'recibido', estadoNuevo: 'en_revision', fecha: '2026-09-11T12:00:00.000Z' },
  { estadoAnterior: 'en_revision', estadoNuevo: 'confirmado', fecha: '2026-09-14T12:00:00.000Z' },
]

describe('LineaTiempoPedido', () => {
  it('marca los estados cumplidos con su fecha, el actual con su mensaje y los futuros como pendientes', () => {
    render(<LineaTiempoPedido estadoActual="confirmado" historialEstados={historial} />)

    expect(screen.getByText(/recibido, 10 de septiembre/i)).toBeInTheDocument()
    expect(screen.getByText('Tu pedido está confirmado. Empezamos a producir cuando recibamos el anticipo.')).toBeInTheDocument()
    expect(screen.getByText('En producción')).toBeInTheDocument()
  })
})
