import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { SnackbarProvider, useSnackbar, type OpcionesAviso } from './Snackbar'

function Disparador({ mensaje, opciones }: { mensaje: string; opciones?: OpcionesAviso }) {
  const { avisar } = useSnackbar()
  return <button onClick={() => avisar(mensaje, opciones)}>{`Avisar ${mensaje}`}</button>
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('Snackbar', () => {
  it('muestra el mensaje y lo retira a los 5 segundos', () => {
    render(
      <SnackbarProvider>
        <Disparador mensaje="Guardamos el acuerdo" />
      </SnackbarProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Avisar Guardamos el acuerdo' }))
    expect(screen.getByText('Guardamos el acuerdo')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(4999)
    })
    expect(screen.getByText('Guardamos el acuerdo')).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(screen.queryByText('Guardamos el acuerdo')).not.toBeInTheDocument()
  })

  it('con una accion dura mas, y hacer clic en ella la ejecuta y cierra el aviso', () => {
    const deshacer = vi.fn()
    render(
      <SnackbarProvider>
        <Disparador mensaje="Cancelamos" opciones={{ accion: { etiqueta: 'Deshacer', alHacerClick: deshacer } }} />
      </SnackbarProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Avisar Cancelamos' }))

    act(() => {
      vi.advanceTimersByTime(7999)
    })
    fireEvent.click(screen.getByRole('button', { name: 'Deshacer' }))

    expect(deshacer).toHaveBeenCalledOnce()
    expect(screen.queryByText('Cancelamos')).not.toBeInTheDocument()
  })

  it('un aviso nuevo reemplaza al anterior y reinicia el reloj', () => {
    render(
      <SnackbarProvider>
        <Disparador mensaje="Uno" />
        <Disparador mensaje="Dos" />
      </SnackbarProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Avisar Uno' }))
    act(() => {
      vi.advanceTimersByTime(4000)
    })
    fireEvent.click(screen.getByRole('button', { name: 'Avisar Dos' }))

    expect(screen.queryByText('Uno', { selector: 'p' })).not.toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(4000)
    })
    expect(screen.getByText('Dos', { selector: 'p' })).toBeInTheDocument()
  })

  it('usarlo fuera del proveedor falla con un mensaje claro', () => {
    // React y jsdom reportan el error esperado por consola y por el evento `error`: se silencian solo aqui
    const silencio = vi.spyOn(console, 'error').mockImplementation(() => {})
    const alError = (e: ErrorEvent) => e.preventDefault()
    window.addEventListener('error', alError)
    expect(() => render(<Disparador mensaje="x" />)).toThrow(/SnackbarProvider/)
    window.removeEventListener('error', alError)
    silencio.mockRestore()
  })
})
