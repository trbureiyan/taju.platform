import { describe, it, expect, vi } from 'vitest'
import { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Dialog } from './Dialog'

function Arnes({ alCerrar = vi.fn() }: { alCerrar?: () => void }) {
  const [abierto, setAbierto] = useState(false)
  return (
    <>
      <button onClick={() => setAbierto(true)}>Abrir</button>
      <Dialog
        abierto={abierto}
        titulo="Cancelar tu solicitud"
        onCerrar={() => {
          alCerrar()
          setAbierto(false)
        }}
      >
        <button>Aceptar</button>
      </Dialog>
    </>
  )
}

describe('Dialog', () => {
  it('cerrado no pinta nada', () => {
    render(<Arnes />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('abierto tiene rol dialog con su titulo como nombre y toma el foco', async () => {
    render(<Arnes />)
    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }))

    const dialogo = screen.getByRole('dialog', { name: 'Cancelar tu solicitud' })
    expect(dialogo).toHaveAttribute('aria-modal', 'true')
    expect(dialogo).toHaveFocus()
  })

  it('Escape cierra y devuelve el foco a quien lo abrio', async () => {
    const alCerrar = vi.fn()
    render(<Arnes alCerrar={alCerrar} />)
    const abrir = screen.getByRole('button', { name: 'Abrir' })
    await userEvent.click(abrir)

    await userEvent.keyboard('{Escape}')

    expect(alCerrar).toHaveBeenCalledOnce()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(abrir).toHaveFocus()
  })

  it('un clic en el fondo cierra', async () => {
    const alCerrar = vi.fn()
    render(<Arnes alCerrar={alCerrar} />)
    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }))

    fireEvent.click(screen.getByTestId('fondo-dialogo'))

    expect(alCerrar).toHaveBeenCalledOnce()
  })

  it('Tab no saca el foco del dialogo', async () => {
    render(<Arnes />)
    await userEvent.click(screen.getByRole('button', { name: 'Abrir' }))
    const dialogo = screen.getByRole('dialog')

    await userEvent.tab()
    await userEvent.tab()
    await userEvent.tab({ shift: true })

    expect(dialogo).toContainElement(document.activeElement as HTMLElement)
  })
})
