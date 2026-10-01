import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CalendarioMes } from './CalendarioMes'

// sabado 3 de octubre de 2026 en la tarde: el primer dia disponible es el lunes 5
const ahora = new Date('2026-10-03T15:00:00-05:00')

describe('CalendarioMes', () => {
  it('muestra el mes del primer dia disponible, con la semana de lunes a domingo', () => {
    render(<CalendarioMes valor="" onCambio={vi.fn()} ahora={ahora} />)
    expect(screen.getByText('octubre de 2026')).toBeInTheDocument()
    expect(screen.getAllByRole('columnheader').map((c) => c.textContent)).toEqual(['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'])
  })

  it('deshabilita domingos, lunes festivos y lo anterior al primer dia disponible', () => {
    render(<CalendarioMes valor="" onCambio={vi.fn()} ahora={ahora} />)
    expect(screen.getByRole('button', { name: 'domingo, 4 de octubre' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'sábado, 3 de octubre' })).toBeDisabled() // antes del minimo
    expect(screen.getByRole('button', { name: 'lunes, 12 de octubre' })).toBeDisabled() // festivo en lunes
    expect(screen.getByRole('button', { name: 'lunes, 5 de octubre' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'sábado, 10 de octubre' })).toBeEnabled()
  })

  it('elegir un dia avisa la fecha y lo marca', async () => {
    const onCambio = vi.fn()
    const { rerender } = render(<CalendarioMes valor="" onCambio={onCambio} ahora={ahora} />)
    await userEvent.click(screen.getByRole('button', { name: 'martes, 13 de octubre' }))
    expect(onCambio).toHaveBeenCalledWith('2026-10-13')
    rerender(<CalendarioMes valor="2026-10-13" onCambio={onCambio} ahora={ahora} />)
    expect(screen.getByRole('button', { name: 'martes, 13 de octubre' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('navega al mes siguiente y vuelve; no deja ir antes del mes del primer dia disponible', async () => {
    render(<CalendarioMes valor="" onCambio={vi.fn()} ahora={ahora} />)
    expect(screen.getByRole('button', { name: 'Mes anterior' })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'Mes siguiente' }))
    expect(screen.getByText('noviembre de 2026')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'martes, 3 de noviembre' })).toBeEnabled()
    await userEvent.click(screen.getByRole('button', { name: 'Mes anterior' }))
    expect(screen.getByText('octubre de 2026')).toBeInTheDocument()
  })

  it('no pasa de 12 meses adelante', async () => {
    render(<CalendarioMes valor="" onCambio={vi.fn()} ahora={ahora} />)
    const siguiente = screen.getByRole('button', { name: 'Mes siguiente' })
    for (let i = 0; i < 12; i += 1) await userEvent.click(siguiente)
    expect(screen.getByText('octubre de 2027')).toBeInTheDocument()
    expect(siguiente).toBeDisabled()
  })

  it('abre en el mes de la fecha elegida si ya hay una', () => {
    render(<CalendarioMes valor="2026-12-15" onCambio={vi.fn()} ahora={ahora} />)
    expect(screen.getByText('diciembre de 2026')).toBeInTheDocument()
  })

  it('explica por que hay dias grises', () => {
    render(<CalendarioMes valor="" onCambio={vi.fn()} ahora={ahora} />)
    expect(screen.getByText(/días en gris no tienen servicio/i)).toBeInTheDocument()
  })
})
