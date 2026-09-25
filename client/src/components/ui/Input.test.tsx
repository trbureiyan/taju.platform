import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Input } from './Input'

function idsDescritos(el: HTMLElement): string[] {
  return (el.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean)
}

describe('Input', () => {
  it('asocia el label al campo', () => {
    render(<Input label="Diámetro de la torta" />)
    expect(screen.getByLabelText('Diámetro de la torta')).toBeInTheDocument()
  })

  it('sin hint ni error no declara aria-describedby ni aria-invalid', () => {
    render(<Input label="Colores" />)
    const campo = screen.getByLabelText('Colores')
    expect(campo).not.toHaveAttribute('aria-describedby')
    expect(campo).not.toHaveAttribute('aria-invalid')
  })

  it('el hint queda enlazado por aria-describedby', () => {
    render(<Input label="Colores" hint="Los colores principales" />)
    expect(screen.getByLabelText('Colores')).toHaveAccessibleDescription('Los colores principales')
  })

  it('con error marca aria-invalid y anuncia el mensaje', () => {
    render(<Input label="Colores" error="Nos faltan los colores" />)
    const campo = screen.getByLabelText('Colores')
    expect(campo).toHaveAttribute('aria-invalid', 'true')
    expect(campo).toHaveAccessibleDescription('Nos faltan los colores')
    expect(screen.getByRole('alert')).toHaveTextContent('Nos faltan los colores')
  })

  // el hint se oculta cuando hay error: aria-describedby no puede apuntar a un id que no esta en el DOM
  it('con hint y error, aria-describedby solo apunta a elementos que existen', () => {
    render(<Input label="Colores" hint="Los colores principales" error="Nos faltan los colores" />)
    const campo = screen.getByLabelText('Colores')
    for (const id of idsDescritos(campo)) {
      expect(document.getElementById(id)).not.toBeNull()
    }
    expect(campo).toHaveAccessibleDescription('Nos faltan los colores')
  })

  it('dos campos con el mismo label no comparten id', () => {
    render(
      <>
        <Input label="Nombre" hint="a" />
        <Input label="Nombre" hint="b" />
      </>,
    )
    const [a, b] = screen.getAllByLabelText('Nombre')
    expect(a.id).not.toBe(b.id)
  })

  it('si quita el outline, trae un foco visible sustituto', () => {
    render(<Input label="Colores" />)
    const clases = screen.getByLabelText('Colores').className
    if (/\boutline-none\b/.test(clases)) {
      expect(clases).toMatch(/focus-visible:(ring|shadow)/)
    }
  })

  it('mantiene el objetivo tactil minimo', () => {
    render(<Input label="Colores" />)
    expect(screen.getByLabelText('Colores').className).toMatch(/\bmin-h-boton\b/)
  })
})
