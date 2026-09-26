import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { PedidoFormPage } from './PedidoFormPage'
import { api } from '../lib/api'
import type { Pedido, Producto } from '../types'

vi.mock('../lib/api', () => ({ api: { get: vi.fn(), postForm: vi.fn() } }))

const producto: Producto = {
  _id: 'prod-1',
  nombre: 'Topper nombre en espejo dorado',
  descripcionTecnica: '',
  categoria: {
    _id: 'cat-1',
    nombre: 'Toppers de acrílico',
    familia: 'toppers',
    dimensionesBase: [{ etiqueta: 'Media libra', valor: 22, unidad: 'cm' }],
  },
  especificacionesTecnicas: {},
  imagenes: [],
  precio: { unitario: 35000, escalas: [] },
  activo: true,
}

// fecha local YYYY-MM-DD a N dias de hoy, igual que la calcula el componente (sin pasar por UTC)
function fechaLocal(dias: number): string {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
}

async function renderFormulario() {
  render(
    <MemoryRouter initialEntries={['/pedido/prod-1']}>
      <Routes>
        <Route path="/pedido/:productoId" element={<PedidoFormPage />} />
        <Route path="/catalogo" element={<p>catalogo</p>} />
      </Routes>
    </MemoryRouter>,
  )
  await screen.findByRole('button', { name: 'Enviar mi pedido' })
}

async function llenarObligatorios() {
  await userEvent.type(screen.getByLabelText('Descripción del pedido'), 'Feliz 15 Valentina')
  await userEvent.type(screen.getByLabelText('Colores'), 'dorado')
  await userEvent.type(screen.getByLabelText('Materiales'), 'acrílico espejo')
}

function enviar() {
  return userEvent.click(screen.getByRole('button', { name: 'Enviar mi pedido' }))
}

beforeEach(() => {
  vi.mocked(api.get).mockReset().mockResolvedValue(producto)
  // producto y fechaEntrega presentes - la pantalla de confirmacion los usa para el mensaje de WhatsApp
  vi.mocked(api.postForm)
    .mockReset()
    .mockResolvedValue({
      _id: 'pedido-1',
      producto: { _id: producto._id, nombre: producto.nombre },
      fechaEntrega: null,
    } as Pedido)
})

describe('PedidoFormPage', () => {
  it('carga el producto por el id de la ruta', async () => {
    await renderFormulario()
    expect(api.get).toHaveBeenCalledWith('/productos/prod-1')
    expect(screen.getByText('Topper nombre en espejo dorado', { selector: 'p' })).toBeInTheDocument()
  })

  describe('dimension', () => {
    it('sin elegir medida base exige el valor en cm y no envia', async () => {
      await renderFormulario()
      await llenarObligatorios()
      await enviar()

      expect(screen.getByLabelText('Valor en cm')).toHaveAttribute('aria-invalid', 'true')
      expect(screen.getByLabelText('Valor en cm')).toHaveAccessibleDescription('Ingresá el valor en cm')
      expect(api.postForm).not.toHaveBeenCalled()
    })

    it('rechaza un valor personalizado de 0', async () => {
      await renderFormulario()
      await llenarObligatorios()
      await userEvent.click(screen.getByLabelText('Medida personalizada'))
      await userEvent.type(screen.getByLabelText('Valor en cm'), '0')
      await enviar()

      expect(screen.getByLabelText('Valor en cm')).toHaveAccessibleDescription('El valor debe ser mayor a 0')
      expect(api.postForm).not.toHaveBeenCalled()
    })

    it('con una medida base elegida no pide el valor libre y manda su valor', async () => {
      await renderFormulario()
      await userEvent.click(screen.getByLabelText('Media libra: 22 cm'))
      expect(screen.queryByLabelText('Valor en cm')).not.toBeInTheDocument()

      await llenarObligatorios()
      await enviar()

      expect(api.postForm).toHaveBeenCalledOnce()
      const fd = vi.mocked(api.postForm).mock.calls[0][1]
      expect(fd.get('dimensionValor')).toBe('22')
      expect(fd.get('esDimensionPersonalizada')).toBe('false')
    })
  })

  describe('fechaEntrega', () => {
    it('rechaza una fecha pasada', async () => {
      await renderFormulario()
      await userEvent.click(screen.getByLabelText('Media libra: 22 cm'))
      await llenarObligatorios()
      fireEvent.change(screen.getByLabelText('Fecha de entrega'), { target: { value: fechaLocal(-1) } })
      await enviar()

      expect(screen.getByLabelText('Fecha de entrega')).toHaveAttribute('aria-invalid', 'true')
      expect(screen.getByLabelText('Fecha de entrega')).toHaveAccessibleDescription(/a partir de/)
      expect(api.postForm).not.toHaveBeenCalled()
    })

    // el minimo es un dia de margen: hoy tampoco alcanza para producir
    it('rechaza la fecha de hoy', async () => {
      await renderFormulario()
      await userEvent.click(screen.getByLabelText('Media libra: 22 cm'))
      await llenarObligatorios()
      fireEvent.change(screen.getByLabelText('Fecha de entrega'), { target: { value: fechaLocal(0) } })
      await enviar()

      expect(api.postForm).not.toHaveBeenCalled()
    })

    it('acepta una fecha futura y la manda en ISO', async () => {
      await renderFormulario()
      await userEvent.click(screen.getByLabelText('Media libra: 22 cm'))
      await llenarObligatorios()
      fireEvent.change(screen.getByLabelText('Fecha de entrega'), { target: { value: fechaLocal(7) } })
      await enviar()

      expect(api.postForm).toHaveBeenCalledOnce()
      const fd = vi.mocked(api.postForm).mock.calls[0][1]
      expect(fd.get('fechaEntrega')).toBe(new Date(`${fechaLocal(7)}T12:00:00`).toISOString())
    })

    it('es opcional: sin fecha el pedido se envia sin ese campo', async () => {
      await renderFormulario()
      await userEvent.click(screen.getByLabelText('Media libra: 22 cm'))
      await llenarObligatorios()
      await enviar()

      const fd = vi.mocked(api.postForm).mock.calls[0][1]
      expect(fd.has('fechaEntrega')).toBe(false)
    })
  })

  it('marca los campos de texto obligatorios vacios', async () => {
    await renderFormulario()
    await userEvent.click(screen.getByLabelText('Media libra: 22 cm'))
    await enviar()

    for (const campo of ['Descripción del pedido', 'Colores', 'Materiales']) {
      expect(screen.getByLabelText(campo)).toHaveAttribute('aria-invalid', 'true')
    }
    expect(api.postForm).not.toHaveBeenCalled()
  })

  it('tras un envio exitoso reemplaza el formulario por la confirmacion', async () => {
    await renderFormulario()
    await userEvent.click(screen.getByLabelText('Media libra: 22 cm'))
    await llenarObligatorios()
    await enviar()

    expect(await screen.findByText(/pedido-1/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Enviar mi pedido' })).not.toBeInTheDocument()

    // el enlace de WhatsApp lleva el numero real, el id de seguimiento y el nombre del producto prellenados
    const enlaceWhatsApp = screen.getByRole('link', { name: 'Confirmar por WhatsApp' })
    expect(enlaceWhatsApp).toHaveAttribute('href', expect.stringContaining('wa.me/573192452842'))
    expect(decodeURIComponent(enlaceWhatsApp.getAttribute('href')!)).toContain('pedido-1')
    expect(decodeURIComponent(enlaceWhatsApp.getAttribute('href')!)).toContain(producto.nombre)
  })

  it('muestra el error del servidor, por ejemplo el 409 de pedido duplicado', async () => {
    vi.mocked(api.postForm).mockRejectedValueOnce(new Error('Ya recibimos este mismo pedido hace un momento.'))
    await renderFormulario()
    await userEvent.click(screen.getByLabelText('Media libra: 22 cm'))
    await llenarObligatorios()
    await enviar()

    expect(await screen.findByRole('alert')).toHaveTextContent('Ya recibimos este mismo pedido')
  })
})
