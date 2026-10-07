import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Footer } from './Footer'
import { useAuth } from '../../contexts/AuthContext'
import { RESPONSABLE } from '../../lib/politicaDatos'
import type { Usuario } from '../../types'

vi.mock('../../contexts/AuthContext', () => ({ useAuth: vi.fn() }))

function montar(usuario: Usuario | null = null) {
  vi.mocked(useAuth).mockReturnValue({
    usuario,
    autenticado: usuario !== null,
    login: vi.fn(),
    registrar: vi.fn(),
    logout: vi.fn(),
  })
  return render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>,
  )
}

describe('Footer | estructura', () => {
  it('se organiza en bloques con título: navegar, contacto y dónde estamos', () => {
    montar()
    for (const nombre of ['Navegar', 'Contacto', 'Dónde estamos']) {
      expect(screen.getByRole('heading', { level: 2, name: nombre })).toBeInTheDocument()
    }
    expect(screen.getByRole('contentinfo')).toHaveTextContent('TaJú · Papelería Creativa')
  })

  it('presenta qué hace el taller con las palabras de su propia presentación', () => {
    montar()
    expect(screen.getByRole('contentinfo')).toHaveTextContent(/papelería creativa personalizada/i)
  })

  it('navegar: catálogo, preguntas frecuentes e ingresar cuando no hay sesión', () => {
    montar()
    const nav = screen.getByRole('navigation', { name: 'Pie de página' })
    expect(within(nav).getByRole('link', { name: 'Catálogo' })).toHaveAttribute('href', '/catalogo')
    expect(within(nav).getByRole('link', { name: 'Preguntas frecuentes' })).toHaveAttribute('href', '/preguntas-frecuentes')
    expect(within(nav).getByRole('link', { name: 'Ingresar' })).toHaveAttribute('href', '/login')
    expect(within(nav).queryByRole('link', { name: 'Mis pedidos' })).not.toBeInTheDocument()
  })

  it('con sesión de cliente ofrece Mis pedidos en vez de Ingresar', () => {
    montar({ _id: 'u1', nombre: 'Ana', email: 'ana@taju.co', rol: 'cliente' })
    const nav = screen.getByRole('navigation', { name: 'Pie de página' })
    expect(within(nav).getByRole('link', { name: 'Mis pedidos' })).toHaveAttribute('href', '/mis-pedidos')
    expect(within(nav).queryByRole('link', { name: 'Ingresar' })).not.toBeInTheDocument()
  })
})

describe('Footer | contacto', () => {
  it('WhatsApp es un enlace con el número visible', () => {
    montar()
    const enlace = screen.getByRole('link', { name: /WhatsApp/ })
    expect(enlace.getAttribute('href')).toContain('https://wa.me/')
    expect(enlace).toHaveTextContent(RESPONSABLE.telefono)
    expect(enlace).toHaveAttribute('target', '_blank')
    expect(enlace).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('redes: Instagram y Facebook abren en pestaña nueva', () => {
    montar()
    const instagram = screen.getByRole('link', { name: /Instagram/ })
    expect(instagram).toHaveAttribute('href', 'https://www.instagram.com/taju_neiva')
    const facebook = screen.getByRole('link', { name: /Facebook/ })
    expect(facebook.getAttribute('href')).toContain('https://www.facebook.com/')
    for (const e of [instagram, facebook]) {
      expect(e).toHaveAttribute('target', '_blank')
      expect(e).toHaveAttribute('rel', 'noopener noreferrer')
    }
  })

  it('el correo es un enlace mailto con la dirección confirmada', () => {
    montar()
    expect(screen.getByRole('link', { name: RESPONSABLE.correo })).toHaveAttribute('href', `mailto:${RESPONSABLE.correo}`)
  })

  it('no publica el segundo teléfono que figura en Facebook', () => {
    montar()
    expect(screen.getByRole('contentinfo').textContent).not.toMatch(/305\s?264/)
  })
})

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
})

describe('Footer | franja legal', () => {
  it('enlaza a la política de datos y conserva el nombre y el año', () => {
    montar()
    expect(screen.getByRole('link', { name: 'Cómo tratamos tus datos' })).toHaveAttribute('href', '/datos')
    expect(screen.getByRole('contentinfo')).toHaveTextContent('Tajú Neiva')
    expect(screen.getByRole('contentinfo')).toHaveTextContent(String(new Date().getFullYear()))
  })

  it('todos los enlaces tienen el objetivo táctil mínimo', () => {
    const { container } = montar()
    for (const a of container.querySelectorAll('a')) expect(a.className).toContain('min-h-boton')
  })
})
