import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ProductoCard } from './ProductoCard'
import { producto } from '../../test/productos'
import type { Producto } from '../../types'

function renderTarjeta(p: Producto, mostrarFamilia = false) {
  return render(
    <MemoryRouter>
      <ProductoCard producto={p} mostrarFamilia={mostrarFamilia} />
    </MemoryRouter>
  )
}

describe('ProductoCard', () => {
  it('es un solo enlace con el nombre del producto hacia su detalle', () => {
    renderTarjeta(producto({ _id: 'abc', nombre: 'Topper luna' }))
    const enlaces = screen.getAllByRole('link')
    expect(enlaces).toHaveLength(1)
    expect(enlaces[0]).toHaveAccessibleName('Topper luna')
    expect(enlaces[0]).toHaveAttribute('href', '/catalogo/abc')
  })

  it('sin foto muestra la silueta de su familia, no un placeholder externo', () => {
    const { container } = renderTarjeta(producto({ familia: 'superficies' }))
    expect(screen.getByTestId('silueta')).toHaveClass('bg-familia-superficies')
    expect(container.innerHTML).not.toContain('placehold.co')
  })

  it('si la foto falla cae a la silueta', () => {
    renderTarjeta(producto({ nombre: 'Topper', imagenes: ['https://x/roto.jpg'] }))
    fireEvent.error(screen.getByRole('img', { name: 'Topper' }))
    expect(screen.getByTestId('silueta')).toBeInTheDocument()
  })

  it('el precio por escala muestra el unitario, el minimo y "Por volumen"', () => {
    renderTarjeta(
      producto({
        precio: { unitario: null, escalas: [{ cantidadMinima: 12, precioUnitario: 2500 }] },
        familia: 'superficies',
      })
    )
    expect(screen.getByText('$2.500 c/u · desde 12 unidades')).toBeInTheDocument()
    expect(screen.getByText('Por volumen')).toBeInTheDocument()
  })

  it('sin precio dice "Te lo cotizamos"', () => {
    renderTarjeta(producto({ precio: { unitario: null, escalas: [] } }))
    expect(screen.getByText('Te lo cotizamos')).toBeInTheDocument()
  })

  it('la familia solo aparece cuando se mezclan familias', () => {
    renderTarjeta(producto({ familia: 'papeleria' }))
    expect(screen.queryByText('Papelería')).not.toBeInTheDocument()
  })

  it('con mostrarFamilia la tarjeta dice su familia', () => {
    renderTarjeta(producto({ familia: 'papeleria' }), true)
    expect(screen.getByText('Papelería')).toBeInTheDocument()
  })
})
