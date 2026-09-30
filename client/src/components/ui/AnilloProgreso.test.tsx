import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AnilloProgreso } from './AnilloProgreso'

describe('AnilloProgreso', () => {
  it('se nombra con el paso, el total y el titulo del momento', () => {
    render(<AnilloProgreso paso={2} titulo="Cómo lo imaginas" />)
    expect(screen.getByRole('img', { name: 'Paso 2 de 4: Cómo lo imaginas' })).toBeInTheDocument()
  })

  it('marca los arcos cumplidos, el activo y los pendientes', () => {
    const { container } = render(<AnilloProgreso paso={3} titulo="Cuándo y dónde" />)
    const estados = Array.from(container.querySelectorAll('circle')).map((c) => c.getAttribute('data-estado'))
    expect(estados).toEqual(['cumplido', 'cumplido', 'activo', 'pendiente'])
  })

  it('el total cambia la cantidad de arcos', () => {
    const { container } = render(<AnilloProgreso paso={1} total={3} titulo="Uno" />)
    expect(container.querySelectorAll('circle')).toHaveLength(3)
  })

  it('el tamano grande usa una caja mayor que el compacto', () => {
    const { container, rerender } = render(<AnilloProgreso paso={1} titulo="Uno" tamano="compacto" />)
    expect(container.firstElementChild).toHaveClass('w-12')
    rerender(<AnilloProgreso paso={1} titulo="Uno" tamano="grande" />)
    expect(container.firstElementChild).toHaveClass('w-24')
  })
})
