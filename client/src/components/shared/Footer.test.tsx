import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Footer } from './Footer'
import { useAuth } from '../../contexts/AuthContext'
import { RESPONSABLE } from '../../lib/politicaDatos'

vi.mock('../../contexts/AuthContext', () => ({ useAuth: vi.fn() }))

function montar() {
  vi.mocked(useAuth).mockReturnValue({ usuario: null, autenticado: false, login: vi.fn(), registrar: vi.fn(), logout: vi.fn() })
  return render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>,
  )
}

describe('Footer | ubicación', () => {
  it('muestra un mapa incrustado con título accesible, cargado de forma diferida', () => {
    montar()
    const mapa = screen.getByTitle('Mapa con la ubicación de TaJú')
    expect(mapa.tagName).toBe('IFRAME')
    expect(mapa.getAttribute('src')).toContain('2.9406778,-75.2503933')
    expect(mapa).toHaveAttribute('loading', 'lazy')
  })

  it('escribe la dirección que ya está publicada en /datos, sin repetirla a mano', () => {
    montar()
    expect(screen.getByText(RESPONSABLE.direccion)).toBeInTheDocument()
  })

  it('ofrece abrir la ubicación en Google Maps en una pestaña nueva', () => {
    montar()
    const enlace = screen.getByRole('link', { name: 'Cómo llegar' })
    expect(enlace.getAttribute('href')).toContain('google.com/maps')
    expect(enlace).toHaveAttribute('target', '_blank')
    expect(enlace).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('enlaza a la política de datos', () => {
    montar()
    expect(screen.getByRole('link', { name: 'Cómo tratamos tus datos' })).toHaveAttribute('href', '/datos')
  })
})
