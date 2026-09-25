import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { useAuth } from '../../contexts/AuthContext'
import { RUTA_INICIO_POR_ROL, type Rol, type Usuario } from '../../types'

vi.mock('../../contexts/AuthContext', () => ({ useAuth: vi.fn() }))

function sesion(usuario: Usuario | null) {
  vi.mocked(useAuth).mockReturnValue({
    usuario,
    autenticado: usuario !== null,
    login: vi.fn(),
    registrar: vi.fn(),
    logout: vi.fn(),
  })
}

function usuarioCon(rol: Rol): Usuario {
  return { _id: 'u1', nombre: 'Laura', email: 'laura@taju.co', rol }
}

// cada destino posible pinta un marcador propio para saber a donde termino la redireccion
function renderEn(rolRequerido?: Rol) {
  render(
    <MemoryRouter initialEntries={['/protegida']}>
      <Routes>
        <Route
          path="/protegida"
          element={
            <ProtectedRoute rol={rolRequerido}>
              <p>contenido protegido</p>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<p>pantalla de login</p>} />
        <Route path={RUTA_INICIO_POR_ROL.cliente} element={<p>inicio cliente</p>} />
        <Route path={RUTA_INICIO_POR_ROL.administrador} element={<p>inicio administrador</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.mocked(useAuth).mockReset()
})

describe('ProtectedRoute', () => {
  it('sin sesion redirige a /login', () => {
    sesion(null)
    renderEn('cliente')
    expect(screen.getByText('pantalla de login')).toBeInTheDocument()
    expect(screen.queryByText('contenido protegido')).not.toBeInTheDocument()
  })

  it('sin sesion redirige a /login aunque la ruta no pida rol', () => {
    sesion(null)
    renderEn()
    expect(screen.getByText('pantalla de login')).toBeInTheDocument()
  })

  it('cliente en ruta de administrador va a su propio inicio, no a /login', () => {
    sesion(usuarioCon('cliente'))
    renderEn('administrador')
    expect(screen.getByText('inicio cliente')).toBeInTheDocument()
    expect(screen.queryByText('pantalla de login')).not.toBeInTheDocument()
  })

  it('administrador en ruta de cliente va al panel de taller', () => {
    sesion(usuarioCon('administrador'))
    renderEn('cliente')
    expect(screen.getByText('inicio administrador')).toBeInTheDocument()
  })

  it('con el rol correcto renderiza children', () => {
    sesion(usuarioCon('administrador'))
    renderEn('administrador')
    expect(screen.getByText('contenido protegido')).toBeInTheDocument()
  })

  it('sin rol requerido cualquier sesion renderiza children', () => {
    sesion(usuarioCon('cliente'))
    renderEn()
    expect(screen.getByText('contenido protegido')).toBeInTheDocument()
  })
})
