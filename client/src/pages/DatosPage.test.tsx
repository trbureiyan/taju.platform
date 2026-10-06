import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { DatosPage } from './DatosPage'
import { TEXTOS_POLITICA, VERSION_POLITICA_DATOS } from '../lib/politicaDatos'

describe('DatosPage', () => {
  it('muestra un título, la versión y todas las secciones', () => {
    render(<MemoryRouter><DatosPage /></MemoryRouter>)
    expect(screen.getByRole('heading', { level: 1, name: 'Cómo tratamos tus datos' })).toBeInTheDocument()
    expect(screen.getByText(new RegExp(VERSION_POLITICA_DATOS))).toBeInTheDocument()
    for (const s of TEXTOS_POLITICA) {
      expect(screen.getByRole('heading', { level: 2, name: s.titulo })).toBeInTheDocument()
    }
  })
  it('ofrece volver a crear la cuenta', () => {
    render(<MemoryRouter><DatosPage /></MemoryRouter>)
    expect(screen.getByRole('link', { name: 'Volver al registro' })).toHaveAttribute('href', '/registrar')
  })
})
