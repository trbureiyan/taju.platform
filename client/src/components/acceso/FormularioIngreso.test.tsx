import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { FormularioIngreso } from './FormularioIngreso'
import { SnackbarProvider } from '../ui/Snackbar'
import { useAuth } from '../../contexts/AuthContext'
import { ErrorApi } from '../../lib/api'
import { simularMedios } from '../../test/setup'
import type { Usuario } from '../../types'

vi.mock('../../contexts/AuthContext', () => ({ useAuth: vi.fn() }))

const ana: Usuario = { _id: 'u1', nombre: 'Ana', email: 'ana@taju.co', rol: 'cliente' }
const login = vi.fn()

function montar(props: Partial<React.ComponentProps<typeof FormularioIngreso>> = {}) {
  const alIngresar = vi.fn()
  render(
    <MemoryRouter>
      <SnackbarProvider>
        <FormularioIngreso alIngresar={alIngresar} {...props} />
      </SnackbarProvider>
    </MemoryRouter>,
  )
  return { alIngresar }
}
const escribirYEnviar = async (correo = 'ana@taju.co', clave = 'clave-segura-123') => {
  await userEvent.type(screen.getByLabelText('Correo'), correo)
  await userEvent.type(screen.getByLabelText('Contraseña'), clave)
  await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
}

beforeEach(() => {
  simularMedios()
  login.mockReset()
  vi.mocked(useAuth).mockReturnValue({ usuario: null, autenticado: false, login, registrar: vi.fn(), logout: vi.fn() })
})

describe('FormularioIngreso', () => {
  it('ingresa con el correo recortado y avisa con el usuario', async () => {
    login.mockResolvedValueOnce(ana)
    const { alIngresar } = montar()
    await escribirYEnviar('  ana@taju.co  ')
    expect(login).toHaveBeenCalledWith('ana@taju.co', 'clave-segura-123')
    await waitFor(() => expect(alIngresar).toHaveBeenCalledWith(ana))
  })

  it('con campos vacíos no llama al servidor y marca el primero inválido con el foco', async () => {
    montar()
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
    expect(login).not.toHaveBeenCalled()
    const correo = screen.getByLabelText('Correo')
    expect(correo).toHaveAttribute('aria-invalid', 'true')
    expect(correo).toHaveFocus()
    // un solo aviso de resumen dentro del formulario, no uno por campo (el snackbar tiene sus propias regiones)
    const alertas = correo.closest('form')!.querySelectorAll('[role="alert"]')
    expect(alertas).toHaveLength(1)
    expect(alertas[0]).toHaveTextContent('Revisa los campos marcados')
  })

  it('valida el correo al salir del campo y vuelve a validar al cambiar', async () => {
    montar()
    await userEvent.type(screen.getByLabelText('Correo'), 'ana')
    await userEvent.tab()
    expect(screen.getByLabelText('Correo')).toHaveAttribute('aria-invalid', 'true')
    await userEvent.type(screen.getByLabelText('Correo'), '@taju.co')
    expect(screen.getByLabelText('Correo')).not.toHaveAttribute('aria-invalid')
  })

  it('un 401 muestra el siguiente paso concreto y conserva lo escrito', async () => {
    login.mockRejectedValueOnce(new ErrorApi('Credenciales incorrectas', 401))
    montar()
    await escribirYEnviar()
    const alerta = (await screen.findAllByRole('alert')).find((a) => a.closest('form'))
    expect(alerta).toHaveTextContent('Revisa tu correo y tu contraseña')
    expect(screen.getByLabelText('Correo')).toHaveValue('ana@taju.co')
  })

  it('red caída va al snackbar con tono de error y no deja el botón bloqueado', async () => {
    login.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    montar()
    await escribirYEnviar()
    expect(await screen.findByText(/Tus datos siguen aquí/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeEnabled()
  })

  it('el botón de mostrar contraseña alterna el tipo del campo', async () => {
    montar()
    const campo = screen.getByLabelText('Contraseña')
    expect(campo).toHaveAttribute('type', 'password')
    await userEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }))
    expect(campo).toHaveAttribute('type', 'text')
  })

  it('un doble clic envía una sola vez', async () => {
    let resolver!: (u: Usuario) => void
    login.mockReturnValueOnce(new Promise<Usuario>((r) => (resolver = r)))
    montar()
    await userEvent.type(screen.getByLabelText('Correo'), 'ana@taju.co')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'clave-segura-123')
    const boton = screen.getByRole('button', { name: 'Ingresar' })
    await userEvent.dblClick(boton)
    expect(login).toHaveBeenCalledTimes(1)
    resolver(ana)
  })

  it('avisa el correo escrito a quien lo pida (para la constancia)', async () => {
    const alCambiarCorreo = vi.fn()
    montar({ alCambiarCorreo })
    await userEvent.type(screen.getByLabelText('Correo'), 'a')
    expect(alCambiarCorreo).toHaveBeenLastCalledWith('a')
  })

  it('tras un 401 sin campo inválido el foco vuelve al correo', async () => {
    login.mockRejectedValueOnce(new ErrorApi('Credenciales incorrectas', 401))
    montar()
    await escribirYEnviar()
    await screen.findAllByRole('alert')
    await waitFor(() => expect(screen.getByLabelText('Correo')).toHaveFocus())
  })

  it('tras una caída de red el foco vuelve al correo', async () => {
    login.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    montar()
    await escribirYEnviar()
    await screen.findByText(/Tus datos siguen aquí/)
    await waitFor(() => expect(screen.getByLabelText('Correo')).toHaveFocus())
  })

  it('el aviso de revisión desaparece al editar un campo', async () => {
    montar()
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
    expect(screen.getByText(/Revisa los campos marcados/)).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Correo'), 'a')
    expect(screen.queryByText(/Revisa los campos marcados/)).not.toBeInTheDocument()
  })

  it('dos envíos seguidos del formulario llaman a login una sola vez', async () => {
    login.mockReturnValueOnce(new Promise<Usuario>(() => {}))
    montar()
    await userEvent.type(screen.getByLabelText('Correo'), 'ana@taju.co')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'clave-segura-123')
    const form = screen.getByLabelText('Correo').closest('form')!
    fireEvent.submit(form)
    fireEvent.submit(form)
    expect(login).toHaveBeenCalledTimes(1)
  })
})
