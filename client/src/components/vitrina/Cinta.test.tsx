import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Cinta } from './Cinta'

describe('Cinta', () => {
  it('el boton de pausa detiene el bucle y alterna su etiqueta', async () => {
    render(<Cinta />)
    const pista = screen.getByTestId('cinta-pista')
    expect(pista).toHaveStyle({ animationPlayState: 'running' })

    await userEvent.click(screen.getByRole('button', { name: 'Pausar la cinta' }))
    expect(pista).toHaveStyle({ animationPlayState: 'paused' })

    await userEvent.click(screen.getByRole('button', { name: 'Reanudar la cinta' }))
    expect(pista).toHaveStyle({ animationPlayState: 'running' })
  })

  it('el texto en bucle no se lee con lector de pantalla', () => {
    render(<Cinta />)
    expect(screen.getByTestId('cinta-pista')).toHaveAttribute('aria-hidden', 'true')
  })
})
