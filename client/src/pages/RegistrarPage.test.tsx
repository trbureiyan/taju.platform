import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { RegistrarPage } from './RegistrarPage'
import { SnackbarProvider } from '../components/ui/Snackbar'
import { useAuth } from '../contexts/AuthContext'
import { ErrorApi } from '../lib/api'
import { simularMedios } from '../test/setup'
import { RUTA_INICIO_POR_ROL, type Usuario } from '../types'

vi.mock('../contexts/AuthContext', () => ({ useAuth: vi.fn() }))

// registra cada navegación y además navega de verdad, para que el marcador Destino siga funcionando
const navegar = vi.hoisted(() => vi.fn())
vi.mock('react-router-dom', async (orig) => {
  const real = await orig<typeof import('react-router-dom')>()
  return {
    ...real,
    useNavigate: () => {
      const navigate = real.useNavigate()
      return (...args: Parameters<typeof navigate>) => {
        navegar(...args)
        return navigate(...args)
      }
    },
  }
})

const ana: Usuario = { _id: 'u1', nombre: 'Ana', email: 'ana@taju.co', rol: 'cliente' }
const registrar = vi.fn()

function Destino({ nombre }: { nombre: string }) {
  return <p>destino {nombre} {useLocation().pathname}</p>
}
function montar(ruta: string) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <SnackbarProvider>
        <Routes>
          <Route path="/registrar" element={<RegistrarPage />} />
          <Route path="/login" element={<p>pantalla de ingreso</p>} />
          <Route path="/pedido/:id" element={<Destino nombre="pedido" />} />
          <Route path={RUTA_INICIO_POR_ROL.cliente} element={<Destino nombre="cliente" />} />
          <Route path={RUTA_INICIO_POR_ROL.administrador} element={<Destino nombre="administrador" />} />
          <Route path="*" element={<Destino nombre="otra" />} />
        </Routes>
      </SnackbarProvider>
    </MemoryRouter>,
  )
}
async function llenar({ nombre = 'Ana Pérez', correo = 'ana@taju.co', clave = 'clave-segura-123', acepta = true } = {}) {
  await userEvent.type(screen.getByLabelText('Nombre'), nombre)
  await userEvent.type(screen.getByLabelText('Correo'), correo)
  await userEvent.type(screen.getByLabelText('Contraseña'), clave)
  if (acepta) await userEvent.click(screen.getByRole('checkbox', { name: /Autorizo el tratamiento/ }))
}
const enviar = () => userEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }))

beforeEach(() => {
  simularMedios()
  registrar.mockReset()
  navegar.mockClear()
  vi.mocked(useAuth).mockReturnValue({ usuario: null, autenticado: false, login: vi.fn(), registrar, logout: vi.fn() })
})
afterEach(() => {
  vi.useRealTimers()
  simularMedios()
})

describe('RegistrarPage', () => {
  it('desde un pedido explica el motivo', () => {
    montar('/registrar?redirect=/pedido/p1')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Antes de enviar tu solicitud, crea tu cuenta' }),
    ).toBeInTheDocument()
  })

  it('la franja refleja el nombre mientras se teclea', async () => {
    montar('/registrar')
    expect(screen.getByText(/Tu cuenta quedará a tu nombre/)).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Nombre'), 'Ana')
    expect(screen.getByText(/Cuenta a nombre de Ana/)).toBeInTheDocument()
  })

  it('sin la casilla de autorización no envía y la marca con el foco en el primer inválido', async () => {
    const { container } = montar('/registrar')
    await llenar({ acepta: false })
    await enviar()
    const casilla = screen.getByRole('checkbox', { name: /Autorizo el tratamiento/ })
    expect(registrar).not.toHaveBeenCalled()
    expect(casilla).toHaveAttribute('aria-invalid', 'true')
    expect(casilla).toHaveFocus()
    const form = container.querySelector('form') as HTMLFormElement
    expect(within(form).getAllByRole('alert')).toHaveLength(1)
  })

  it('envía los datos recortados y aceptaDatos: true', async () => {
    registrar.mockResolvedValueOnce(ana)
    montar('/registrar')
    await llenar({ nombre: '  Ana Pérez  ', correo: '  ana@taju.co  ' })
    await enviar()
    expect(registrar).toHaveBeenCalledWith('Ana Pérez', 'ana@taju.co', 'clave-segura-123', true)
  })

  it('un 409 marca el correo y ofrece ingresar conservando el destino', async () => {
    registrar.mockRejectedValueOnce(new ErrorApi('El correo ya está registrado', 409))
    montar('/registrar?redirect=/pedido/p1')
    await llenar()
    await enviar()
    expect(await screen.findByText(/Ese correo ya tiene una cuenta/)).toBeInTheDocument()
    expect(screen.getByLabelText('Correo')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Correo')).toHaveFocus()
    const enlaces = screen.getAllByRole('link', { name: 'Ingresa' })
    expect(enlaces).toHaveLength(2)
    expect(enlaces[0]).toHaveAttribute('href', '/login?redirect=/pedido/p1')
  })

  it('al corregir el correo desaparece el error del servidor', async () => {
    registrar.mockRejectedValueOnce(new ErrorApi('El correo ya está registrado', 409))
    montar('/registrar')
    await llenar()
    await enviar()
    await screen.findByText(/Ese correo ya tiene una cuenta/)
    await userEvent.type(screen.getByLabelText('Correo'), 'x')
    expect(screen.queryByText(/Ese correo ya tiene una cuenta/)).not.toBeInTheDocument()
    expect(screen.getByLabelText('Correo')).not.toHaveAttribute('aria-invalid')
  })

  it('la contraseña nunca aparece como texto', async () => {
    montar('/registrar')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'secreta-1')
    expect(document.body.textContent).not.toContain('secreta-1')
  })

  it('al registrarse anuncia el éxito, espera y navega al destino de origen', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    registrar.mockResolvedValueOnce(ana)
    montar('/registrar?redirect=/pedido/p1')
    await llenar()
    await enviar()
    expect(await screen.findByText('Listo, tu cuenta quedó creada.')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(400)
    expect(screen.queryByText(/destino pedido/)).not.toBeInTheDocument() // 400 ms: aún en la espera de 650
    await act(() => vi.advanceTimersByTimeAsync(300))
    expect(screen.getByText('destino pedido /pedido/p1')).toBeInTheDocument()
  })

  it('con movimiento reducido la espera es de 300 ms', async () => {
    simularMedios(['(prefers-reduced-motion: reduce)'])
    vi.useFakeTimers({ shouldAdvanceTime: true })
    registrar.mockResolvedValueOnce(ana)
    montar('/registrar?redirect=/pedido/p1')
    await llenar()
    await enviar()
    await screen.findByText('Listo, tu cuenta quedó creada.')
    await act(() => vi.advanceTimersByTimeAsync(350))
    // 350 ms alcanza para 300 pero no para 650
    expect(screen.getByText('destino pedido /pedido/p1')).toBeInTheDocument()
  })

  it('un doble toque durante la solicitud y la espera registra una sola vez', async () => {
    registrar.mockResolvedValue(ana)
    montar('/registrar')
    await llenar()
    await userEvent.dblClick(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(registrar).toHaveBeenCalledTimes(1)
  })

  it('si la persona sale de la vista durante la espera no navega después', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    registrar.mockResolvedValueOnce(ana)
    const vista = montar('/registrar?redirect=/pedido/p1')
    await llenar()
    await enviar()
    await screen.findByText('Listo, tu cuenta quedó creada.')
    vista.unmount()
    await vi.advanceTimersByTimeAsync(700)
    expect(navegar).not.toHaveBeenCalled()
  })

  it('tras un 429 sin campo inválido el foco vuelve al correo', async () => {
    registrar.mockRejectedValueOnce(new ErrorApi('Demasiados intentos', 429))
    montar('/registrar')
    await llenar()
    await enviar()
    await screen.findByText(/Espera unos minutos/)
    await waitFor(() => expect(screen.getByLabelText('Correo')).toHaveFocus())
  })

  it('tras una caída de red el foco vuelve al correo', async () => {
    registrar.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    montar('/registrar')
    await llenar()
    await enviar()
    await screen.findByText(/Tus datos siguen aquí/)
    await waitFor(() => expect(screen.getByLabelText('Correo')).toHaveFocus())
  })

  it('el aviso de revisión desaparece al editar un campo', async () => {
    montar('/registrar')
    await enviar()
    expect(screen.getByText(/Revisa los campos marcados/)).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Nombre'), 'A')
    expect(screen.queryByText(/Revisa los campos marcados/)).not.toBeInTheDocument()
  })

  it('dos envíos seguidos del formulario registran una sola vez', async () => {
    registrar.mockReturnValueOnce(new Promise<Usuario>(() => {}))
    const { container } = montar('/registrar')
    await llenar()
    const form = container.querySelector('form') as HTMLFormElement
    fireEvent.submit(form)
    fireEvent.submit(form)
    expect(registrar).toHaveBeenCalledTimes(1)
  })

  it('429 va al snackbar sin el texto del servidor', async () => {
    registrar.mockRejectedValueOnce(new ErrorApi('Demasiados intentos. Esperá unos minutos', 429))
    montar('/registrar')
    await llenar()
    await enviar()
    expect(await screen.findByText(/Espera unos minutos/)).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/Esperá/)
  })

  it('el enlace a /datos abre la política en otra pestaña', () => {
    montar('/registrar')
    const enlace = screen.getByRole('link', { name: 'Cómo tratamos tus datos' })
    expect(enlace).toHaveAttribute('href', '/datos')
    expect(enlace).toHaveAttribute('target', '_blank')
    expect(enlace).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('no hay voseo en la vista', () => {
    montar('/registrar')
    expect(document.body.textContent).not.toMatch(/Creá|Ingresá|tenés|Registrate|Revisá/)
  })
})
