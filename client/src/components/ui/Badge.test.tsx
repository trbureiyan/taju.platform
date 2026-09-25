import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge, BadgeEstado } from './Badge'
import { ESTADOS_PEDIDO, ETIQUETAS_ESTADO } from '../../types'

describe('Badge', () => {
  it('renderiza su contenido con la variante neutra por defecto', () => {
    render(<Badge>Nuevo</Badge>)
    const badge = screen.getByText('Nuevo')
    expect(badge.className).toMatch(/bg-superficie-elevada/)
  })

  // un badge es informativo: no debe colarse en el orden de tabulacion ni hacerse pasar por boton
  it('no es interactivo', () => {
    render(<Badge variante="aviso">En producción</Badge>)
    const badge = screen.getByText('En producción')
    expect(badge.tagName).toBe('SPAN')
    expect(badge).not.toHaveAttribute('tabindex')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('usa solo clases de tokens semanticos, nunca la paleta cruda de Tailwind', () => {
    for (const variante of ['neutro', 'exito', 'aviso', 'error', 'info'] as const) {
      const { unmount } = render(<Badge variante={variante}>x</Badge>)
      expect(screen.getByText('x').className).not.toMatch(/\b(bg|text|border)-(gray|yellow|red|green|blue)-\d/)
      unmount()
    }
  })
})

describe('BadgeEstado', () => {
  it.each(ESTADOS_PEDIDO)('muestra la etiqueta canonica de %s', (estado) => {
    render(<BadgeEstado estado={estado} etiqueta={ETIQUETAS_ESTADO[estado]} />)
    expect(screen.getByText(ETIQUETAS_ESTADO[estado])).toBeInTheDocument()
  })
})
