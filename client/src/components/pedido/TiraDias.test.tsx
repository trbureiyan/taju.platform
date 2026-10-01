import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TiraDias } from './TiraDias'

const sabadoEnLaTarde = new Date('2026-10-03T15:00:00-05:00')

describe('TiraDias', () => {
  it('el fieldset puede encogerse (min-w-0): sin eso la tira de 14 dias ensancha la columna y queda bajo el resumen', () => {
    const { container } = render(<TiraDias valor="" onCambio={vi.fn()} ahora={sabadoEnLaTarde} />)
    expect(container.querySelector('fieldset')).toHaveClass('min-w-0')
  })

  it('lista solo dias con servicio, empezando en el primero disponible', () => {
    render(<TiraDias valor="" onCambio={vi.fn()} ahora={sabadoEnLaTarde} />)
    const dias = screen.getAllByRole('radio').map((r) => r.getAttribute('aria-label'))
    expect(dias).toHaveLength(14)
    expect(dias[0]).toBe('lunes, 5 de octubre')
    expect(dias).not.toContain('domingo, 4 de octubre')
    expect(dias).toContain('sábado, 10 de octubre')
    expect(dias).not.toContain('domingo, 11 de octubre')
    expect(dias).not.toContain('lunes, 12 de octubre') // festivo
    expect(dias).toContain('martes, 13 de octubre')
  })

  it('escribe el dia de la semana en cada celda y deja una linea fija sobre los domingos y lunes festivos', () => {
    render(<TiraDias valor="" onCambio={vi.fn()} ahora={sabadoEnLaTarde} />)
    expect(screen.getByText('No hay servicio los domingos ni los lunes festivos.')).toBeInTheDocument()
    expect(screen.getAllByText(/^lun/i).length).toBeGreaterThan(0)
  })

  it('elegir un dia avisa la fecha', async () => {
    const onCambio = vi.fn()
    render(<TiraDias valor="" onCambio={onCambio} ahora={sabadoEnLaTarde} />)
    await userEvent.click(screen.getByRole('radio', { name: 'martes, 6 de octubre' }))
    expect(onCambio).toHaveBeenCalledWith('2026-10-06')
  })

  it('marca el dia elegido', () => {
    render(<TiraDias valor="2026-10-06" onCambio={vi.fn()} ahora={sabadoEnLaTarde} />)
    expect(screen.getByRole('radio', { name: 'martes, 6 de octubre' })).toBeChecked()
  })

  it('el calendario esta cerrado y se abre con "Ver el calendario"', async () => {
    render(<TiraDias valor="" onCambio={vi.fn()} ahora={sabadoEnLaTarde} />)
    const boton = screen.getByRole('button', { name: 'Ver el calendario' })
    expect(boton).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('grid')).not.toBeInTheDocument()

    await userEvent.click(boton)

    expect(screen.getByRole('button', { name: 'Ocultar el calendario' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('grid')).toBeInTheDocument()
  })

  it('elegir un dia lejano en el calendario avisa la fecha', async () => {
    const onCambio = vi.fn()
    render(<TiraDias valor="" onCambio={onCambio} ahora={sabadoEnLaTarde} />)
    await userEvent.click(screen.getByRole('button', { name: 'Ver el calendario' }))
    await userEvent.click(screen.getByRole('button', { name: 'Mes siguiente' }))
    await userEvent.click(screen.getByRole('button', { name: 'martes, 17 de noviembre' }))
    expect(onCambio).toHaveBeenCalledWith('2026-11-17')
  })

  it('una fecha en domingo fuera de la tira muestra el mensaje con el siguiente dia disponible', () => {
    // 18 de octubre es domingo y queda fuera de los 14 dias de la tira
    render(<TiraDias valor="2026-10-18" onCambio={vi.fn()} ahora={sabadoEnLaTarde} />)
    expect(screen.getByText(/Los domingos no hay servicio/)).toBeInTheDocument()
  })

  it('muestra el error de validacion que le pasa el momento', () => {
    render(<TiraDias valor="" onCambio={vi.fn()} ahora={sabadoEnLaTarde} error="Nos falta la fecha en que la necesitas." />)
    expect(screen.getByText('Nos falta la fecha en que la necesitas.')).toBeInTheDocument()
  })
})
