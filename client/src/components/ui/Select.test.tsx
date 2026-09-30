import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Select } from './Select'

describe('Select', () => {
  it('asocia la etiqueta y muestra la ayuda', () => {
    render(
      <Select label="Medio de pago" hint="El que usaron para el anticipo" defaultValue="nequi">
        <option value="nequi">Nequi</option>
      </Select>,
    )
    expect(screen.getByLabelText('Medio de pago')).toHaveAccessibleDescription('El que usaron para el anticipo')
  })

  it('con error marca aria-invalid, lo anuncia y oculta la ayuda', () => {
    render(
      <Select label="Hora" hint="Ayuda" error="Elige la hora en que la necesitas." defaultValue="">
        <option value="">Elige</option>
      </Select>,
    )
    const campo = screen.getByLabelText('Hora')
    expect(campo).toHaveAttribute('aria-invalid', 'true')
    expect(campo).toHaveAccessibleDescription('Elige la hora en que la necesitas.')
    expect(screen.queryByText('Ayuda')).not.toBeInTheDocument()
  })
})
