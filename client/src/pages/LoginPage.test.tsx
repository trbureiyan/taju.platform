import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { LoginPage } from './LoginPage'
import { SnackbarProvider } from '../components/ui/Snackbar'
import { useAuth } from '../contexts/AuthContext'
import { simularMedios } from '../test/setup'
import { RUTA_INICIO_POR_ROL, type Usuario } from '../types'

vi.mock('../contexts/AuthContext', () => ({ useAuth: vi.fn() }))

const ana: Usuario = { _id: 'u1', nombre: 'Ana', email: 'ana@taju.co', rol: 'cliente' }
const admin: Usuario = { ...ana, _id: 'u2', rol: 'administrador' }
const login = vi.fn()

function Destino({ nombre }: { nombre: string }) {
  return <p>destino {nombre} {useLocation().pathname}</p>
}
function montar(ruta: string) {
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <SnackbarProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registrar" element={<p>pantalla de registro</p>} />
          <Route path="/pedido/:id" element={<Destino nombre="pedido" />} />
          <Route path={RUTA_INICIO_POR_ROL.cliente} element={<Destino nombre="cliente" />} />
          <Route path={RUTA_INICIO_POR_ROL.administrador} element={<Destino nombre="administrador" />} />
          <Route path="*" element={<Destino nombre="otra" />} />
        </Routes>
      </SnackbarProvider>
    </MemoryRouter>,
  )
}
async function ingresar() {
  await userEvent.type(screen.getByLabelText('Correo'), 'ana@taju.co')
  await userEvent.type(screen.getByLabelText('Contraseña'), 'clave-segura-123')
  await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
}

beforeEach(() => {
  simularMedios()
  login.mockReset()
  vi.mocked(useAuth).mockReturnValue({ usuario: null, autenticado: false, login, registrar: vi.fn(), logout: vi.fn() })
})

describe('LoginPage', () => {
  it('sin origen muestra el titular general', () => {
    montar('/login')
    expect(screen.getByRole('heading', { level: 1, name: 'Ingresa a tu cuenta' })).toBeInTheDocument()
  })

  it('desde un pedido explica el motivo en el titular', () => {
    montar('/login?redirect=/pedido/p1')
    expect(screen.getByRole('heading', { level: 1, name: 'Ingresa para enviar tu solicitud' })).toBeInTheDocument()
  })

  it('al ingresar vuelve al pedido de origen', async () => {
    login.mockResolvedValueOnce(ana)
    montar('/login?redirect=/pedido/p1')
    await ingresar()
    expect(await screen.findByText('destino pedido /pedido/p1')).toBeInTheDocument()
  })

  it('sin origen va al inicio por rol', async () => {
    login.mockResolvedValueOnce(admin)
    montar('/login')
    await ingresar()
    expect(await screen.findByText(/destino administrador/)).toBeInTheDocument()
  })

  it.each(['//otro.com', 'https://otro.com', '/\\otro.com'])('ignora un redirect peligroso (%s)', async (malo) => {
    login.mockResolvedValueOnce(ana)
    montar(`/login?redirect=${encodeURIComponent(malo)}`)
    await ingresar()
    expect(await screen.findByText(/destino cliente/)).toBeInTheDocument()
  })

  it('el enlace a registrarse conserva el destino de origen', () => {
    montar('/login?redirect=/pedido/p1')
    expect(screen.getByRole('link', { name: 'Crea una cuenta' })).toHaveAttribute('href', '/registrar?redirect=/pedido/p1')
  })

  it('no hay voseo en la vista', () => {
    montar('/login')
    expect(document.body.textContent).not.toMatch(/Ingresá|Registrate|tenés|Revisá/)
  })
})
