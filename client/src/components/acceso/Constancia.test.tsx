import { describe, it, expect, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Constancia } from './Constancia'
import { simularMedios } from '../../test/setup'

const ESCRITORIO = '(min-width: 1024px)'
const lunes10am = new Date('2026-10-05T15:00:00Z') // 10:00 en Bogotá
const lunes10pm = new Date('2026-10-06T03:00:00Z') // 22:00 del lunes en Bogotá (martes en UTC)

afterEach(() => simularMedios())

describe('Constancia | escritorio', () => {
  it('refleja el nombre y el correo mientras se teclean', () => {
    simularMedios([ESCRITORIO])
    render(<Constancia modo="registro" nombre="Ana Pérez" correo="ana@taju.co" ahora={lunes10am} />)
    expect(screen.getByText('Ana Pérez')).toBeInTheDocument()
    expect(screen.getByText('ana@taju.co')).toBeInTheDocument()
  })

  it('las líneas sin dato dicen Pendiente (la atenuación nunca es la única señal)', () => {
    simularMedios([ESCRITORIO])
    render(<Constancia modo="registro" ahora={lunes10am} />)
    expect(screen.getAllByText('Pendiente')).toHaveLength(3) // nombre, correo y contraseña
  })

  it('el valor se actualiza en el mismo nodo: la animación no se repite en cada tecla', () => {
    simularMedios([ESCRITORIO])
    const { rerender } = render(<Constancia modo="registro" nombre="A" ahora={lunes10am} />)
    const antes = screen.getByText('A')
    rerender(<Constancia modo="registro" nombre="An" ahora={lunes10am} />)
    expect(screen.getByText('An')).toBe(antes)
  })

  it('en ingreso no hay línea de nombre y sí correo, fecha y la frase', () => {
    simularMedios([ESCRITORIO])
    render(<Constancia modo="ingreso" correo="ana@taju.co" ahora={lunes10am} />)
    expect(screen.queryByText('Cuenta a nombre de')).not.toBeInTheDocument()
    expect(screen.getByText('ana@taju.co')).toBeInTheDocument()
    expect(screen.getByText('Fecha')).toBeInTheDocument()
    expect(screen.getByText('Con tu cuenta sigues tus pedidos y envías solicitudes.')).toBeInTheDocument()
  })

  it('la fecha es la de Bogotá desde el inicio, no la de UTC', () => {
    simularMedios([ESCRITORIO])
    render(<Constancia modo="registro" ahora={lunes10pm} />)
    expect(screen.getByText('lunes, 5 de octubre')).toBeInTheDocument()
  })

  it('la contraseña pasa a Definida y nunca muestra su valor', () => {
    simularMedios([ESCRITORIO])
    const { rerender } = render(<Constancia modo="registro" ahora={lunes10am} />)
    expect(screen.queryByText('Definida')).not.toBeInTheDocument()
    rerender(<Constancia modo="registro" contrasenaDefinida ahora={lunes10am} />)
    expect(screen.getByText('Definida')).toBeInTheDocument()
  })

  it('el bloque va oculto a lectores y no hay ninguna región viva que lea cada tecla', () => {
    simularMedios([ESCRITORIO])
    const { container } = render(<Constancia modo="registro" nombre="Ana" ahora={lunes10am} />)
    expect(screen.getByText('Cuenta a nombre de').closest('[aria-hidden="true"]')).not.toBeNull()
    expect(container.querySelector('[aria-live]')).toBeNull()
  })

  it('solo la confirmación se anuncia, en un role=status fuera del bloque oculto', () => {
    simularMedios([ESCRITORIO])
    const { rerender } = render(<Constancia modo="registro" nombre="Ana" ahora={lunes10am} />)
    const estado = screen.getByRole('status')
    expect(estado).toBeEmptyDOMElement()
    expect(estado.closest('[aria-hidden="true"]')).toBeNull()
    rerender(<Constancia modo="registro" nombre="Ana" confirmada ahora={lunes10am} />)
    expect(screen.getByRole('status')).toHaveTextContent('Listo, tu cuenta quedó creada')
  })

  it('el ingreso nunca muestra el nombre de una cuenta', () => {
    simularMedios([ESCRITORIO])
    render(<Constancia modo="ingreso" nombre="Ana Pérez" correo="ana@taju.co" ahora={lunes10am} />)
    expect(screen.queryByText('Ana Pérez')).not.toBeInTheDocument()
    expect(screen.getByText('ana@taju.co')).toBeInTheDocument()
  })

  it('las frases fijas del registro son las verificadas', () => {
    simularMedios([ESCRITORIO])
    render(<Constancia modo="registro" ahora={lunes10am} />)
    expect(screen.getByText('El taller ve quién envía cada solicitud.')).toBeInTheDocument()
    expect(screen.getByText('Tus pedidos quedan en tu historial.')).toBeInTheDocument()
    expect(screen.getByText('Guardamos tu autorización con su fecha.')).toBeInTheDocument()
  })
})

describe('Constancia | franja móvil', () => {
  it('antes de escribir promete la cuenta a su nombre', () => {
    render(<Constancia modo="registro" ahora={lunes10am} />)
    expect(screen.getByText(/Tu cuenta quedará a tu nombre/)).toBeInTheDocument()
  })

  it('con nombre largo se trunca en una sola línea en vez de desbordar', () => {
    const largo = 'María de los Ángeles Fernanda Rodríguez de la Hoz '.repeat(2).trim()
    render(<Constancia modo="registro" nombre={largo} ahora={lunes10am} />)
    const texto = screen.getByText(new RegExp(`Cuenta a nombre de ${largo.slice(0, 10)}`))
    expect(texto).toHaveClass('truncate')
    expect(texto.parentElement).toHaveClass('min-h-boton')
  })

  it('la franja va oculta a lectores, con la fecha de Bogotá', () => {
    render(<Constancia modo="registro" ahora={lunes10pm} />)
    const franja = screen.getByText(/Tu cuenta quedará a tu nombre/)
    expect(franja.closest('[aria-hidden="true"]')).not.toBeNull()
    expect(franja).toHaveTextContent('lunes, 5 de octubre')
  })

  it('el status móvil empieza vacío y anuncia la confirmación', () => {
    const { rerender } = render(<Constancia modo="registro" ahora={lunes10am} />)
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
    rerender(<Constancia modo="registro" confirmada ahora={lunes10am} />)
    expect(screen.getByRole('status')).toHaveTextContent('Listo, tu cuenta quedó creada')
  })

  it('en ingreso muestra el correo y no un nombre', () => {
    render(<Constancia modo="ingreso" correo="ana@taju.co" ahora={lunes10am} />)
    expect(screen.getByText(/ana@taju.co/)).toBeInTheDocument()
  })
})
