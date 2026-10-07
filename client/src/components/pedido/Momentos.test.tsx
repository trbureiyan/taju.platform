import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { MomentoQue } from './MomentoQue'
import { MomentoComo } from './MomentoComo'
import { MomentoCuando } from './MomentoCuando'
import { MomentoRepaso } from './MomentoRepaso'
import { CAMPOS_INICIALES, type Campos, type Errores } from '../../lib/validarSolicitud'
import type { Producto } from '../../types'

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
const superficies: Producto = {
  ...producto,
  categoria: { ...producto.categoria, familia: 'superficies', dimensionesBase: [] },
  precio: { unitario: null, escalas: [{ cantidadMinima: 12, precioUnitario: 9000 }] },
}

function props(parcial: { campos?: Partial<Campos>; errores?: Errores; producto?: Producto } = {}) {
  return {
    producto: parcial.producto ?? producto,
    campos: { ...CAMPOS_INICIALES, ...parcial.campos },
    errores: parcial.errores ?? {},
    set: vi.fn(),
    tituloRef: createRef<HTMLHeadingElement>(),
  }
}

describe('MomentoQue', () => {
  it('ofrece las medidas sugeridas como tarjetas y la medida personalizada', async () => {
    const p = props()
    render(<MomentoQue {...p} />)
    expect(screen.getByRole('heading', { name: 'Qué necesitas' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('radio', { name: /Media libra/ }))
    expect(p.set).toHaveBeenCalledWith('dimensionSeleccionada', 'Media libra')
    expect(screen.getByRole('radio', { name: /Otra medida/ })).toBeInTheDocument()
  })

  it('muestra el valor en cm solo con medida personalizada o sin medidas sugeridas', () => {
    const { rerender } = render(<MomentoQue {...props()} />)
    // sin tarjeta elegida todavia no hay valor en cm que pedir
    expect(screen.queryByLabelText('Valor en cm')).not.toBeInTheDocument()
    rerender(<MomentoQue {...props({ campos: { dimensionSeleccionada: 'Media libra' } })} />)
    expect(screen.queryByLabelText('Valor en cm')).not.toBeInTheDocument()
    rerender(<MomentoQue {...props({ campos: { dimensionSeleccionada: 'personalizada' } })} />)
    expect(screen.getByLabelText('Valor en cm')).toBeInTheDocument()
  })

  it('sin tarjeta elegida marca las tarjetas y las enlaza al mensaje', () => {
    const mensaje = 'Elige una medida sugerida o marca Otra medida y escríbela en centímetros.'
    render(<MomentoQue {...props({ errores: { dimensionSeleccionada: mensaje } })} />)
    for (const radio of screen.getAllByRole('radio')) {
      expect(radio).toHaveAttribute('aria-invalid', 'true')
      expect(radio).toHaveAccessibleDescription(mensaje)
    }
    expect(screen.getByText(mensaje)).toBeInTheDocument()
  })

  it('superficies dice el minimo en la ayuda de la cantidad y usa teclado numerico', () => {
    render(<MomentoQue {...props({ producto: superficies })} />)
    const cantidad = screen.getByLabelText('Cantidad')
    expect(cantidad).toHaveAttribute('inputmode', 'numeric')
    expect(cantidad).toHaveAccessibleDescription(/desde 12 unidades/)
  })

  it('un resumen de errores se anuncia una sola vez y los campos quedan marcados', () => {
    render(<MomentoQue {...props({ errores: { colores: 'Indica los colores que quieres.', materiales: 'Indica el material.' } })} />)
    expect(screen.getAllByRole('alert')).toHaveLength(1)
    expect(screen.getByLabelText('Colores')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Colores')).toHaveAccessibleDescription('Indica los colores que quieres.')
  })

  it('lleva el enlace de dudas al pie', () => {
    render(<MomentoQue {...props()} />)
    expect(screen.getByRole('link', { name: /Dudas/i })).toHaveAttribute('href', expect.stringContaining('wa.me'))
  })
})

describe('MomentoComo', () => {
  it('pide la referencia (obligatoria en toppers) y la descripcion con su tope', () => {
    render(<MomentoComo {...props()} archivos={[]} cambiarArchivos={vi.fn()} />)
    expect(screen.getByRole('heading', { name: 'Cómo lo imaginas' })).toBeInTheDocument()
    expect(screen.getByText(/obligatoria/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Descripción del pedido')).toHaveAttribute('maxlength', '500')
  })

  it('en otras familias la referencia es opcional', () => {
    const papeleria = { ...producto, categoria: { ...producto.categoria, familia: 'papeleria' as const } }
    render(<MomentoComo {...props({ producto: papeleria })} archivos={[]} cambiarArchivos={vi.fn()} />)
    expect(screen.getByText(/opcional/i)).toBeInTheDocument()
  })

  it('desde "Pedir de nuevo" avisa que las imagenes hay que adjuntarlas otra vez', () => {
    render(<MomentoComo {...props()} archivos={[]} cambiarArchivos={vi.fn()} desdeOtroPedido />)
    expect(screen.getByText(/adjúntalas de nuevo/i)).toBeInTheDocument()
  })

  it('el error de referencia queda enlazado a la zona', () => {
    render(<MomentoComo {...props({ errores: { archivos: 'Adjunta una imagen de referencia. Sin verla no podemos cotizar tu pedido.' } })} archivos={[]} cambiarArchivos={vi.fn()} />)
    expect(screen.getByLabelText(/Elige imágenes de referencia/i)).toHaveAccessibleDescription(/Adjunta una imagen/)
  })
})

describe('MomentoCuando', () => {
  it('el domicilio no se limita a Neiva: la opción lo dice y el campo pide la ciudad si es fuera', async () => {
    const { rerender } = render(<MomentoCuando {...props({ campos: { entregaMetodo: 'domicilio' } })} />)
    expect(screen.getByRole('radio', { name: 'A domicilio' })).toBeInTheDocument()
    expect(screen.queryByRole('radio', { name: /en Neiva/ })).not.toBeInTheDocument()
    expect(screen.getByLabelText('Ciudad, barrio o dirección')).toBeInTheDocument()
    expect(screen.getByText(/fuera de Neiva, escribe también la ciudad/)).toBeInTheDocument()
    rerender(<MomentoCuando {...props({ campos: { entregaMetodo: 'recoger' } })} />)
    expect(screen.queryByLabelText('Ciudad, barrio o dirección')).not.toBeInTheDocument()
  })

  it('ofrece recoger o domicilio como tarjetas y pide la direccion solo a domicilio', async () => {
    const p = props()
    const { rerender } = render(<MomentoCuando {...p} />)
    expect(screen.getByRole('heading', { name: 'Cuándo y dónde' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Ciudad, barrio o dirección')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('radio', { name: /A domicilio/ }))
    expect(p.set).toHaveBeenCalledWith('entregaMetodo', 'domicilio')
    rerender(<MomentoCuando {...props({ campos: { entregaMetodo: 'domicilio' } })} />)
    expect(screen.getByLabelText('Ciudad, barrio o dirección')).toHaveAttribute('maxlength', '200')
  })

  it('las horas dependen del dia elegido: el sabado termina a las 3 p. m. y sin dia no hay horas', () => {
    const { rerender } = render(<MomentoCuando {...props()} />)
    expect(screen.getByLabelText('Hora en que la necesitas')).toBeDisabled()
    rerender(<MomentoCuando {...props({ campos: { fechaDeseada: '2026-10-10' } })} />)
    const horas = Array.from(screen.getByLabelText('Hora en que la necesitas').querySelectorAll('option')).map((o) => o.textContent)
    expect(horas[horas.length - 1]).toBe('3:00 p. m.')
  })

  // [CodeRabbit] cambiar el dia deja guardada una hora que ya no existe ese dia: la hoja de resumen la mostraria
  // mientras el select dice "Elige una hora"
  describe('al cambiar de dia', () => {
    async function elegirSabado(hora: string) {
      vi.useFakeTimers({ toFake: ['Date'] })
      vi.setSystemTime(new Date('2026-09-30T10:00:00-05:00'))
      try {
        const p = props({ campos: { fechaDeseada: '2026-10-09', horaDeseada: hora } })
        render(<MomentoCuando {...p} />)
        await userEvent.click(screen.getByRole('radio', { name: 'sábado, 10 de octubre' }))
        return p
      } finally {
        vi.useRealTimers()
      }
    }

    it('borra la hora guardada si ese dia no la ofrece (el sabado cierra antes)', async () => {
      const p = await elegirSabado('17:00')
      expect(p.set).toHaveBeenCalledWith('fechaDeseada', '2026-10-10')
      expect(p.set).toHaveBeenCalledWith('horaDeseada', '')
    })

    it('conserva la hora guardada si ese dia tambien la ofrece', async () => {
      const p = await elegirSabado('10:00')
      expect(p.set).toHaveBeenCalledWith('fechaDeseada', '2026-10-10')
      expect(p.set).not.toHaveBeenCalledWith('horaDeseada', '')
    })
  })

  it('el celular usa teclado numerico y autocompletado', () => {
    render(<MomentoCuando {...props()} />)
    const celular = screen.getByLabelText('Tu celular')
    expect(celular).toHaveAttribute('inputmode', 'numeric')
    expect(celular).toHaveAttribute('autocomplete', 'tel-national')
  })
})

describe('MomentoRepaso', () => {
  it('muestra la hoja de resumen, el precio estimado y aclara que enviar no compromete', () => {
    render(
      <MomentoRepaso
        {...props({ campos: { dimensionSeleccionada: 'Media libra', cantidad: '2', colores: 'dorado', materiales: 'acrílico' } })}
        archivos={[]}
        errorEnvio={null}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Repaso' })).toBeInTheDocument()
    expect(screen.getByText('Topper nombre en espejo dorado')).toBeInTheDocument()
    expect(screen.getByText('$70.000')).toBeInTheDocument()
    expect(screen.getByText(/enviar no te compromete a nada/i)).toBeInTheDocument()
  })

  // el flotante no se monta en el formulario: sin este enlace el repaso no tendria salida a WhatsApp
  it('lleva el enlace de dudas con el nombre del producto', () => {
    render(<MomentoRepaso {...props()} archivos={[]} errorEnvio={null} />)
    const enlace = screen.getByRole('link', { name: /Dudas/i })
    expect(enlace).toHaveAttribute('href', expect.stringContaining('wa.me'))
    expect(decodeURIComponent(enlace.getAttribute('href')!)).toContain('Topper nombre en espejo dorado')
  })

  it('muestra el error de envio como alerta', () => {
    render(<MomentoRepaso {...props()} archivos={[]} errorEnvio="No pudimos enviar tu pedido." />)
    expect(screen.getByRole('alert')).toHaveTextContent('No pudimos enviar tu pedido.')
  })
})
