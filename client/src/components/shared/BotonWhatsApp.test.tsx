import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BotonWhatsApp } from './BotonWhatsApp'

describe('BotonWhatsApp | flotante', () => {
  it('es un enlace a WhatsApp con nombre accesible y mensaje prellenado', () => {
    render(<BotonWhatsApp variante="flotante" mensaje="Hola TaJú" />)
    const enlace = screen.getByRole('link', { name: 'Escríbenos por WhatsApp' })
    expect(enlace.getAttribute('href')).toMatch(/^https:\/\/wa\.me\/\d+\?text=Hola/)
    expect(enlace).toHaveAttribute('target', '_blank')
    expect(enlace).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('usa el logo oficial de WhatsApp, decorativo porque el enlace ya tiene nombre', () => {
    const { container } = render(<BotonWhatsApp variante="flotante" mensaje="Hola" />)
    const logo = container.querySelector('img')
    expect(logo).not.toBeNull()
    expect(logo).toHaveAttribute('src', '/terceros/whatsapp.svg')
    expect(logo).toHaveAttribute('alt', '')
    // el ícono genérico de burbuja de Lucide era ambiguo: ya no está
    expect(container.querySelector('svg')).toBeNull()
  })

  it('es más grande que antes (64 px, de la escala del sistema) y conserva el foco visible', () => {
    render(<BotonWhatsApp variante="flotante" mensaje="Hola" />)
    const enlace = screen.getByRole('link', { name: 'Escríbenos por WhatsApp' })
    expect(enlace).toHaveClass('w-16', 'h-16')
    expect(enlace).not.toHaveClass('w-14')
    expect(enlace.className).toContain('focus-visible:shadow-foco')
  })
})
