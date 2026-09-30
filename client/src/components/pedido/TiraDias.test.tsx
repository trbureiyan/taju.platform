import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TiraDias } from './TiraDias'

const sabadoEnLaTarde = new Date('2026-10-03T15:00:00-05:00')

describe('TiraDias', () => {
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

  it('"otra fecha" usa el primer dia disponible como minimo', () => {
    render(<TiraDias valor="" onCambio={vi.fn()} ahora={sabadoEnLaTarde} />)
    expect(screen.getByLabelText('Otra fecha')).toHaveAttribute('min', '2026-10-05')
  })

  it('"otra fecha" en domingo da el mensaje con el siguiente dia disponible', () => {
    const onCambio = vi.fn()
    render(<TiraDias valor="2026-10-18" onCambio={onCambio} ahora={sabadoEnLaTarde} />)
    // 18 de octubre es domingo y queda fuera de los 14 dias de la tira, asi que se muestra en "otra fecha"
    expect(screen.getByLabelText('Otra fecha')).toHaveValue('2026-10-18')
    expect(screen.getByLabelText('Otra fecha')).toHaveAccessibleDescription(/Los domingos no hay servicio/)
  })

  it('escribir una fecha en "otra fecha" la avisa', () => {
    const onCambio = vi.fn()
    render(<TiraDias valor="" onCambio={onCambio} ahora={sabadoEnLaTarde} />)
    fireEvent.change(screen.getByLabelText('Otra fecha'), { target: { value: '2026-11-03' } })
    expect(onCambio).toHaveBeenCalledWith('2026-11-03')
  })

  it('muestra el error de validacion que le pasa el momento', () => {
    render(<TiraDias valor="" onCambio={vi.fn()} ahora={sabadoEnLaTarde} error="Nos falta la fecha en que la necesitas." />)
    expect(screen.getByText('Nos falta la fecha en que la necesitas.')).toBeInTheDocument()
  })
})
