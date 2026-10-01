import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HojaResumen } from './HojaResumen'

const lineas = [
  { clave: 'producto', etiqueta: 'Producto', valor: 'Topper luna' },
  { clave: 'colores', etiqueta: 'Colores', valor: null },
]

describe('HojaResumen', () => {
  it('muestra cada linea con su valor', () => {
    render(<HojaResumen lineas={lineas} />)
    expect(screen.getByRole('heading', { name: 'Tu solicitud' })).toBeInTheDocument()
    expect(screen.getByText('Topper luna')).toBeInTheDocument()
  })

  it('lo pendiente dice "Pendiente" con palabras: no depende solo del tono', () => {
    render(<HojaResumen lineas={lineas} />)
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
  })

  it('con fija es un panel lateral con altura maxima y scroll interno', () => {
    const { container } = render(<HojaResumen lineas={lineas} fija />)
    const clases = (container.firstElementChild as HTMLElement).className
    expect(clases).toContain('lg:sticky')
    expect(clases).toContain('lg:overflow-y-auto')
    expect(clases).toContain('lg:max-h-')
  })

  it('por defecto NO es fija: en el repaso y en la pantalla de exito no se pega ni tapa lo que sigue', () => {
    const { container } = render(<HojaResumen lineas={lineas} />)
    const clases = (container.firstElementChild as HTMLElement).className
    expect(clases).not.toContain('sticky')
    expect(clases).not.toContain('overflow-y-auto')
    expect(clases).not.toContain('lg:static')
  })
})
