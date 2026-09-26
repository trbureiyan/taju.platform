import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Manifiesto } from './Manifiesto'
import { FrasesQueCompletan } from './FrasesQueCompletan'
import { simularMedios } from '../../test/setup'

describe('efectos de scroll con reduced-motion', () => {
  afterEach(() => simularMedios())

  it('el manifiesto se ve completo, sin palabras atenuadas', () => {
    simularMedios(['(prefers-reduced-motion: reduce)'])
    render(<Manifiesto />)
    const titulo = screen.getByRole('heading', { name: 'Cortamos y grabamos cada pieza en nuestro taller, en Neiva.' })
    expect(titulo.querySelectorAll('span')).toHaveLength(0)
  })

  it('las frases se ven como lista estatica, sin seccion fija aunque sea escritorio', () => {
    simularMedios(['(prefers-reduced-motion: reduce)', '(min-width: 1024px)'])
    render(
      <MemoryRouter>
        <FrasesQueCompletan />
      </MemoryRouter>,
    )
    const region = screen.getByRole('region', { name: /Para que tu topper salga bien/ })
    expect(region.getAttribute('style') ?? '').not.toContain('vh')
    for (const item of within(region).getAllByRole('listitem')) expect(item).not.toHaveClass('absolute')
  })

  it('en escritorio sin reduced-motion la seccion se fija una pantalla por frase', () => {
    simularMedios(['(min-width: 1024px)'])
    render(
      <MemoryRouter>
        <FrasesQueCompletan />
      </MemoryRouter>,
    )
    // jsdom no resuelve vh en toHaveStyle: se lee el atributo tal cual lo escribe React
    expect(screen.getByRole('region', { name: /Para que tu topper salga bien/ }).getAttribute('style')).toContain('400vh')
  })
})
