import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BotonVerContrasena } from './BotonVerContrasena'

describe('BotonVerContrasena', () => {
  it('oculta: ofrece mostrar y avisa que no está presionado', () => {
    render(<BotonVerContrasena visible={false} alAlternar={() => {}} />)
    expect(screen.getByRole('button', { name: 'Mostrar contraseña' })).toHaveAttribute('aria-pressed', 'false')
  })
  it('visible: ofrece ocultar y está presionado', () => {
    render(<BotonVerContrasena visible alAlternar={() => {}} />)
    expect(screen.getByRole('button', { name: 'Ocultar contraseña' })).toHaveAttribute('aria-pressed', 'true')
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
    expect(boton).toHaveClass('min-h-boton')
    expect(boton).toHaveAttribute('type', 'button')
  })
})
