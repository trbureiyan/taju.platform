import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AvisoImagenDialog, type RechazoImagen } from './AvisoImagenDialog'
import { enlaceWhatsApp } from '../../lib/whatsapp'
import type { RazonRechazo } from '../../lib/inspeccionarImagen'

const RAZONES: RazonRechazo[] = ['formato', 'heic', 'peso', 'pixeles', 'ilegible', 'exceso']

describe('AvisoImagenDialog', () => {
  it('no pinta nada sin rechazos', () => {
    render(<AvisoImagenDialog rechazos={[]} onCerrar={vi.fn()} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('lista un motivo por archivo y titula en plural', () => {
    const rechazos: RechazoImagen[] = [
      { nombre: 'IMG_0001.heic', razon: 'heic' },
      { nombre: 'carta.pdf', razon: 'formato' },
    ]
    render(<AvisoImagenDialog rechazos={rechazos} onCerrar={vi.fn()} />)

    expect(screen.getByRole('dialog', { name: 'No pudimos agregar todas tus fotos' })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByText(/IMG_0001\.heic/)).toBeInTheDocument()
    expect(screen.getByText(/carta\.pdf/)).toBeInTheDocument()
  })

  it('con un solo rechazo titula en singular', () => {
    render(<AvisoImagenDialog rechazos={[{ nombre: 'a.jpg', razon: 'peso' }]} onCerrar={vi.fn()} />)
    expect(screen.getByRole('dialog', { name: 'No pudimos agregar tu foto' })).toBeInTheDocument()
  })

  it('el caso HEIC explica cómo cambiar el formato del iPhone', () => {
    render(<AvisoImagenDialog rechazos={[{ nombre: 'IMG_0001.heic', razon: 'heic' }]} onCerrar={vi.fn()} />)
    expect(screen.getByText(/Ajustes > Cámara > Formatos > Más compatible/)).toBeInTheDocument()
  })

  it('ofrece WhatsApp con el enlace del taller', () => {
    render(<AvisoImagenDialog rechazos={[{ nombre: 'a.jpg', razon: 'ilegible' }]} onCerrar={vi.fn()} />)
    const enlace = screen.getByRole('link', { name: /por WhatsApp/ })
    expect(enlace).toHaveAttribute('href', enlaceWhatsApp('Hola TaJú, no pude subir mis fotos de referencia al pedido.'))
    expect(enlace).toHaveAttribute('target', '_blank')
  })

  it('"Volver a mis fotos" y Escape llaman a onCerrar', async () => {
    const onCerrar = vi.fn()
    render(<AvisoImagenDialog rechazos={[{ nombre: 'a.jpg', razon: 'pixeles' }]} onCerrar={onCerrar} />)

    await userEvent.click(screen.getByRole('button', { name: 'Volver a mis fotos' }))
    await userEvent.keyboard('{Escape}')

    expect(onCerrar).toHaveBeenCalledTimes(2)
  })

  it.each(RAZONES)('el texto de %s nombra el archivo y no usa signos de exclamación', (razon) => {
    render(<AvisoImagenDialog rechazos={[{ nombre: 'mi-foto.jpg', razon }]} onCerrar={vi.fn()} />)
    const texto = screen.getByRole('listitem').textContent ?? ''
    expect(texto).toContain('mi-foto.jpg')
    expect(texto).not.toMatch(/[!¡]/)
  })
})
