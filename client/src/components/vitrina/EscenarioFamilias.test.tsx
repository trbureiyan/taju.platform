import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { EscenarioFamilias } from './EscenarioFamilias'
import { CONTENIDO_FAMILIAS } from './contenido'

function renderEscenario() {
  render(
    <MemoryRouter>
      <EscenarioFamilias />
    </MemoryRouter>,
  )
}

describe('EscenarioFamilias', () => {
  it('arranca en toppers con las cuatro familias visibles en el indice', () => {
    renderEscenario()
    const pestanas = screen.getAllByRole('tab')
    expect(pestanas.map((p) => p.textContent)).toEqual(CONTENIDO_FAMILIAS.map((c) => expect.stringContaining(c.nombre)))
    expect(pestanas[0]).toHaveAttribute('aria-selected', 'true')
  })

  it('las flechas del teclado mueven la seleccion, Home y End van a los extremos', async () => {
    renderEscenario()
    const [primera] = screen.getAllByRole('tab')
    primera.focus()
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getAllByRole('tab')[1]).toHaveAttribute('aria-selected', 'true')
    expect(screen.getAllByRole('tab')[1]).toHaveFocus()
    await userEvent.keyboard('{End}')
    expect(screen.getAllByRole('tab')[3]).toHaveAttribute('aria-selected', 'true')
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getAllByRole('tab')[0]).toHaveAttribute('aria-selected', 'true')
    await userEvent.keyboard('{ArrowUp}')
    expect(screen.getAllByRole('tab')[3]).toHaveAttribute('aria-selected', 'true')
    await userEvent.keyboard('{Home}')
    expect(screen.getAllByRole('tab')[0]).toHaveAttribute('aria-selected', 'true')
  })

  it.each(CONTENIDO_FAMILIAS.map((c, i) => [c.familia, i, c.cta] as const))(
    'el CTA de %s lleva al catalogo filtrado',
    async (familia, indice, cta) => {
      renderEscenario()
      await userEvent.click(screen.getAllByRole('tab')[indice])
      expect(screen.getByRole('link', { name: cta })).toHaveAttribute('href', `/catalogo?familia=${familia}`)
    },
  )

  it('el panel muestra el contador y el nombre de la familia activa', async () => {
    renderEscenario()
    await userEvent.click(screen.getAllByRole('tab')[2])
    const panel = screen.getByRole('tabpanel')
    expect(panel).toHaveTextContent('03 / 04')
    expect(panel).toHaveTextContent('Señalética')
  })
})
