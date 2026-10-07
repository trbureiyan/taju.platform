import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PreguntasFrecuentesPage } from './PreguntasFrecuentesPage'
import { GRUPOS_FAQ } from '../components/faq/contenido'

function montar() {
  return render(
    <MemoryRouter>
      <PreguntasFrecuentesPage />
    </MemoryRouter>,
  )
}

describe('PreguntasFrecuentesPage', () => {
  it('tiene un solo h1 y un h2 por grupo', () => {
    montar()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1, name: 'Preguntas frecuentes' })).toBeInTheDocument()
    for (const g of GRUPOS_FAQ) expect(screen.getByRole('heading', { level: 2, name: g.titulo })).toBeInTheDocument()
  })

  it('cada pregunta es un desplegable nativo, cerrado al empezar', () => {
    const { container } = montar()
    const total = GRUPOS_FAQ.flatMap((g) => g.preguntas).length
    const detalles = container.querySelectorAll('details')
    expect(detalles).toHaveLength(total)
    for (const d of detalles) {
      expect(d.hasAttribute('open')).toBe(false)
      expect(d.querySelector('summary')).not.toBeNull()
    }
  })

  it('el resumen de cada pregunta mide al menos el objetivo táctil', () => {
    const { container } = montar()
    for (const s of container.querySelectorAll('summary')) expect(s).toHaveClass('min-h-boton')
  })

  it('ofrece escribir por WhatsApp y leer cómo se tratan los datos', () => {
    montar()
    expect(screen.getByRole('link', { name: /WhatsApp/ }).getAttribute('href')).toContain('wa.me')
    expect(screen.getAllByRole('link', { name: 'Cómo tratamos tus datos' })[0]).toHaveAttribute('href', '/datos')
  })
})
