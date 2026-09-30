import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TarjetaOpcion } from './TarjetaOpcion'

function grupo(seleccionada: string, onChange = vi.fn()) {
  render(
    <fieldset>
      <legend>Cómo recibes tu pedido</legend>
      <TarjetaOpcion name="entrega" value="recoger" checked={seleccionada === 'recoger'} onChange={onChange} titulo="Lo recojo" descripcion="En el taller, en Neiva" />
      <TarjetaOpcion name="entrega" value="domicilio" checked={seleccionada === 'domicilio'} onChange={onChange} titulo="A domicilio" />
    </fieldset>,
  )
  return onChange
}

describe('TarjetaOpcion', () => {
  it('es un radio real con el titulo como nombre', () => {
    grupo('recoger')
    expect(screen.getByRole('radio', { name: /Lo recojo/ })).toBeChecked()
    expect(screen.getByRole('radio', { name: /A domicilio/ })).not.toBeChecked()
  })

  it('al tocar la tarjeta avisa el valor elegido', async () => {
    const onChange = grupo('recoger')
    await userEvent.click(screen.getByText('A domicilio'))
    expect(onChange).toHaveBeenCalledWith('domicilio')
  })

  it('se elige con el teclado: Tab enfoca el radio y Espacio lo marca', async () => {
    const onChange = grupo('')
    await userEvent.tab()
    expect(screen.getByRole('radio', { name: /Lo recojo/ })).toHaveFocus()
    await userEvent.keyboard(' ')
    expect(onChange).toHaveBeenCalledWith('recoger')
  })

  it('muestra la descripcion y marca la seleccionada con algo mas que color', () => {
    const { container } = render(<TarjetaOpcion name="x" value="a" checked onChange={vi.fn()} titulo="Opcion" descripcion="Detalle" />)
    expect(screen.getByText('Detalle')).toBeInTheDocument()
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('deshabilitada no responde', async () => {
    const onChange = vi.fn()
    render(<TarjetaOpcion name="x" value="a" checked={false} onChange={onChange} titulo="Opcion" disabled />)
    await userEvent.click(screen.getByText('Opcion'))
    expect(onChange).not.toHaveBeenCalled()
  })
})
