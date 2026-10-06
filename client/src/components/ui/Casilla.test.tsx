import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { Casilla } from './Casilla'

function Controlada({ error }: { error?: string }) {
  const [marcada, setMarcada] = useState(false)
  return <Casilla etiqueta="Autorizo el tratamiento" checked={marcada} onChange={(e) => setMarcada(e.target.checked)} error={error} />
}

describe('Casilla', () => {
  it('es un checkbox real asociado a su etiqueta y alterna con clic en el texto', async () => {
    render(<Controlada />)
    const casilla = screen.getByRole('checkbox', { name: 'Autorizo el tratamiento' })
    expect(casilla).not.toBeChecked()
    await userEvent.click(screen.getByText('Autorizo el tratamiento'))
    expect(casilla).toBeChecked()
  })

  it('con error marca aria-invalid y enlaza el mensaje', () => {
    render(<Controlada error="Marca la casilla para continuar." />)
    const casilla = screen.getByRole('checkbox')
    expect(casilla).toHaveAttribute('aria-invalid', 'true')
    expect(casilla).toHaveAccessibleDescription('Marca la casilla para continuar.')
  })

  it('el mensaje no es una alerta propia si anunciarError es false', () => {
    render(<Casilla etiqueta="x" error="Falta" anunciarError={false} />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('la etiqueta mide al menos el objetivo táctil', () => {
    render(<Casilla etiqueta="x" />)
    expect(screen.getByText('x').closest('label')).toHaveClass('min-h-boton')
  })
})
