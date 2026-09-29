import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LineaTiempoPedido } from './LineaTiempoPedido'
import { SIGUIENTE_PASO } from '../../lib/pedido'
import type { HistorialEstadoPedido } from '../../types'

const historial: HistorialEstadoPedido[] = [
  { estadoAnterior: null, estadoNuevo: 'recibido', fecha: '2026-09-10T12:00:00.000Z' },
  { estadoAnterior: 'recibido', estadoNuevo: 'en_revision', fecha: '2026-09-11T12:00:00.000Z' },
  { estadoAnterior: 'en_revision', estadoNuevo: 'cancelado', fecha: '2026-09-12T12:00:00.000Z' },
]

describe('LineaTiempoPedido con un pedido cancelado', () => {
  it('muestra lo cumplido, cierra con Cancelado y su fecha, y no inventa pasos futuros', () => {
    render(<LineaTiempoPedido estadoActual="cancelado" historialEstados={historial} />)

    expect(screen.getByText(/recibido, 10 de septiembre/i)).toBeInTheDocument()
    expect(screen.getByText(/en revisión, 11 de septiembre/i)).toBeInTheDocument()
    expect(screen.getByText(/cancelado, 12 de septiembre/i)).toBeInTheDocument()
    expect(screen.getByText(SIGUIENTE_PASO.cancelado)).toBeInTheDocument()
    expect(screen.queryByText('En producción')).not.toBeInTheDocument()
  })
})
