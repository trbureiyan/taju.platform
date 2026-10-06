import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BotonVerContrasena } from './BotonVerContrasena'

describe('BotonVerContrasena', () => {
  it('oculta: ofrece mostrar, sin aria-pressed', () => {
    render(<BotonVerContrasena visible={false} alAlternar={() => {}} />)
    expect(screen.getByRole('button', { name: 'Mostrar contraseña' })).not.toHaveAttribute('aria-pressed')
  })
  it('visible: ofrece ocultar, sin aria-pressed', () => {
    render(<BotonVerContrasena visible alAlternar={() => {}} />)
    expect(screen.getByRole('button', { name: 'Ocultar contraseña' })).not.toHaveAttribute('aria-pressed')
  })
  it('llama a alAlternar con un clic', async () => {
    const alternar = vi.fn()
    render(<BotonVerContrasena visible={false} alAlternar={alternar} />)
    await userEvent.click(screen.getByRole('button'))
    expect(alternar).toHaveBeenCalledOnce()
  })
  it('mide al menos el objetivo táctil y no envía el formulario', () => {
    render(<BotonVerContrasena visible={false} alAlternar={() => {}} />)
    const boton = screen.getByRole('button')
    expect(boton).toHaveClass('min-h-boton', 'min-w-boton')
    expect(boton).toHaveAttribute('type', 'button')
  })
})
