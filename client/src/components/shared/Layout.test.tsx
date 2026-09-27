import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Layout } from './Layout'
import { useAuth } from '../../contexts/AuthContext'
import { useDespertarServidor } from '../../hooks/useDespertarServidor'

vi.mock('../../contexts/AuthContext', () => ({ useAuth: vi.fn() }))
vi.mock('../../hooks/useDespertarServidor', () => ({ useDespertarServidor: vi.fn() }))

function renderEn(ruta: string) {
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <Layout>
        <p>contenido</p>
      </Layout>
    </MemoryRouter>
  )
}

describe('Layout', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      usuario: null,
      autenticado: false,
      login: vi.fn(),
      registrar: vi.fn(),
      logout: vi.fn(),
    })
    vi.mocked(useDespertarServidor).mockClear()
  })

  it.each(['/', '/catalogo'])(
    'en %s muestra footer con razon social y WhatsApp flotante',
    (ruta) => {
      renderEn(ruta)
      const footer = screen.getByRole('contentinfo')
      expect(footer).toHaveTextContent('TaJú · Papelería Creativa')
      expect(footer).toHaveTextContent('Tajú Neiva')
      expect(screen.getByRole('link', { name: 'Escríbenos por WhatsApp' })).toBeInTheDocument()
    }
  )

  it('en /admin no hay footer ni WhatsApp flotante', () => {
    renderEn('/admin/pedidos')
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /whatsapp/i })).not.toBeInTheDocument()
  })

  it.each(['/', '/catalogo', '/catalogo/abc'])(
    '%s va a sangre: la pagina pone su contenedor',
    (ruta) => {
      renderEn(ruta)
      expect(screen.getByRole('main')).not.toHaveClass('max-w-contenedor')
    }
  )

  it('las demas paginas conservan el contenedor', () => {
    renderEn('/mis-pedidos')
    expect(screen.getByRole('main')).toHaveClass('max-w-contenedor')
  })

  it('monta el despertador del servidor en cualquier ruta', () => {
    renderEn('/catalogo')
    expect(useDespertarServidor).toHaveBeenCalled()
  })
})

describe('Layout | WhatsApp en el detalle', () => {
  it('el flotante se oculta en el detalle, que trae su propio WhatsApp contextual', () => {
    vi.mocked(useAuth).mockReturnValue({ usuario: null, autenticado: false, login: vi.fn(), registrar: vi.fn(), logout: vi.fn() })
    renderEn('/catalogo/abc')
    expect(screen.queryByRole('link', { name: 'Escríbenos por WhatsApp' })).not.toBeInTheDocument()
  })
})
