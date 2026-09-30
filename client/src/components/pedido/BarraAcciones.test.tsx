import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BarraAcciones } from './BarraAcciones'

describe('BarraAcciones', () => {
  it('en el momento 1 solo hay Siguiente (no hay a donde volver)', () => {
    render(<BarraAcciones paso={1} onAtras={vi.fn()} enviando={false} />)
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Atrás' })).not.toBeInTheDocument()
  })

  it('en los momentos intermedios hay Atras y Siguiente', async () => {
    const onAtras = vi.fn()
    render(<BarraAcciones paso={2} onAtras={onAtras} enviando={false} />)
    await userEvent.click(screen.getByRole('button', { name: 'Atrás' }))
    expect(onAtras).toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeInTheDocument()
  })

  it('en el repaso la unica accion primaria es Enviar mi pedido', () => {
    render(<BarraAcciones paso={4} onAtras={vi.fn()} enviando={false} />)
    expect(screen.getByRole('button', { name: 'Enviar mi pedido' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Siguiente' })).not.toBeInTheDocument()
  })

  it('mientras se prepara una imagen la accion primaria espera y una linea dice por que', () => {
    render(<BarraAcciones paso={2} onAtras={vi.fn()} enviando={false} procesando />)
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Atrás' })).toBeEnabled()
    expect(screen.getByText('Estamos preparando tu imagen…')).toBeInTheDocument()
  })

  it('mientras envia se deshabilita y una linea dice por que', () => {
    render(<BarraAcciones paso={4} onAtras={vi.fn()} enviando />)
    expect(screen.getByRole('button', { name: /Enviando tu pedido/ })).toBeDisabled()
    expect(screen.getByText(/Estamos enviando tu solicitud/)).toBeInTheDocument()
  })
})
