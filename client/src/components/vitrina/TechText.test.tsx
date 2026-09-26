import { describe, it, expect, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TechText } from './TechText'
import { simularMedios } from '../../test/setup'

describe('TechText', () => {
  afterEach(() => simularMedios())

  it('el lector de pantalla lee la palabra completa, no letra por letra', () => {
    const { container } = render(<TechText texto="Toppers" />)
    expect(screen.getByText('Toppers')).toHaveClass('sr-only')
    const letras = container.querySelector('[data-letras]')
    expect(letras).toHaveAttribute('aria-hidden', 'true')
    expect(letras?.children).toHaveLength(7)
  })

  it('con reduced-motion la palabra queda solida, sin trazo', () => {
    simularMedios(['(prefers-reduced-motion: reduce)', '(pointer: fine)'])
    const { container } = render(<TechText texto="Papelería" />)
    for (const trazo of container.querySelectorAll('[data-trazo]')) {
      expect(trazo).toHaveStyle({ opacity: '0' })
    }
  })

  it('en tactil la palabra arranca como trazo para dibujarse al entrar en pantalla', () => {
    simularMedios([])
    const { container } = render(<TechText texto="Toppers" />)
    expect(container.querySelector('[data-trazo]')).toHaveStyle({ opacity: '1' })
  })
})
