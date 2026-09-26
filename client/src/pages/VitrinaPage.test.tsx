import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { VitrinaPage } from './VitrinaPage'

function renderVitrina() {
  const { container } = render(
    <MemoryRouter>
      <VitrinaPage />
    </MemoryRouter>,
  )
  return container
}

describe('VitrinaPage', () => {
  it('el hero tiene la promesa como h1 y exactamente una accion primaria', () => {
    renderVitrina()
    const hero = screen.getByRole('region', { name: 'Te ayudamos a pedir bien para que salga bien.' })
    const primarias = within(hero)
      .getAllByRole('link')
      .filter((l) => l.dataset.variante === 'primario')
    expect(primarias).toHaveLength(1)
    expect(primarias[0]).toHaveAccessibleName('Ver el catálogo')
    expect(primarias[0]).toHaveAttribute('href', '/catalogo')
  })

  it('el enlace de volumen del hero baja a la franja', () => {
    const container = renderVitrina()
    expect(screen.getByRole('link', { name: /Ver precios por volumen/ })).toHaveAttribute('href', '#por-volumen')
    expect(container.querySelector('#por-volumen')).not.toBeNull()
  })

  it('las piezas del hero son decorativas', () => {
    renderVitrina()
    const hero = screen.getByRole('region', { name: 'Te ayudamos a pedir bien para que salga bien.' })
    expect(within(hero).getByTestId('piezas')).toHaveAttribute('aria-hidden', 'true')
  })

  it('las frases que se completan son una lista de cuatro datos y cierran con el catalogo', () => {
    renderVitrina()
    const frases = screen.getByRole('region', { name: /Para que tu topper salga bien/ })
    expect(within(frases).getAllByRole('listitem')).toHaveLength(4)
    expect(within(frases).getByRole('link', { name: 'Ver el catálogo' })).toHaveAttribute('href', '/catalogo')
  })

  it('la franja no publica precios: los deja al catalogo', () => {
    const container = renderVitrina()
    expect(container.querySelector('#por-volumen')).not.toHaveTextContent('$')
  })
})
