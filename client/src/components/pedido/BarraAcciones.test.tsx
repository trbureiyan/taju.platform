import { describe, it, expect, vi, afterEach } from 'vitest'
import { act, render, screen } from '@testing-library/react'
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

  it('fija en el movil, respeta el area segura inferior del iPhone', () => {
    const { container } = render(<BarraAcciones paso={1} onAtras={vi.fn()} enviando={false} />)
    expect((container.firstChild as HTMLElement).className).toMatch(/env\(safe-area-inset-bottom\)/)
  })

  it('mientras envia se deshabilita y una linea dice por que', () => {
    render(<BarraAcciones paso={4} onAtras={vi.fn()} enviando />)
    expect(screen.getByRole('button', { name: /Enviando tu pedido/ })).toBeDisabled()
    expect(screen.getByText(/Estamos enviando tu solicitud/)).toBeInTheDocument()
  })

  it('mientras envia el boton muestra el spinner y queda ocupado', () => {
    render(<BarraAcciones paso={4} onAtras={vi.fn()} enviando />)
    expect(screen.getByRole('button', { name: /Enviando tu pedido/ })).toHaveAttribute('aria-busy', 'true')
  })

  it('la region de estado ya esta montada antes de enviar, para que el lector anuncie el aviso', () => {
    const { rerender } = render(<BarraAcciones paso={4} onAtras={vi.fn()} enviando={false} />)
    const region = screen.getByRole('status')
    expect(region).toBeEmptyDOMElement()
    rerender(<BarraAcciones paso={4} onAtras={vi.fn()} enviando />)
    expect(screen.getByRole('status')).toBe(region)
    expect(region).toHaveTextContent('Estamos enviando tu solicitud')
  })

  describe('envio lento', () => {
    afterEach(() => vi.useRealTimers())

    it('pasados unos segundos el aviso dice que seguimos trabajando', () => {
      vi.useFakeTimers()
      render(<BarraAcciones paso={4} onAtras={vi.fn()} enviando />)
      expect(screen.queryByText(/Seguimos enviando/)).not.toBeInTheDocument()
      act(() => { vi.advanceTimersByTime(4_000) })
      expect(screen.getByRole('status')).toHaveTextContent('Seguimos enviando tu solicitud')
    })

    it('si el envio termina, el aviso lento no se queda para el proximo intento', () => {
      vi.useFakeTimers()
      const { rerender } = render(<BarraAcciones paso={4} onAtras={vi.fn()} enviando />)
      act(() => { vi.advanceTimersByTime(4_000) })
      rerender(<BarraAcciones paso={4} onAtras={vi.fn()} enviando={false} />)
      rerender(<BarraAcciones paso={4} onAtras={vi.fn()} enviando />)
      expect(screen.getByText(/Estamos enviando tu solicitud/)).toBeInTheDocument()
    })
  })
})
