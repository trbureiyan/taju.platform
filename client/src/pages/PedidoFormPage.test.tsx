import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { PedidoFormPage } from './PedidoFormPage'
import { api, ErrorApi } from '../lib/api'
import { esFestivo } from '../lib/politicas'
import { codigoPedido } from '../lib/pedido'
import { MENSAJE_FALTA_FECHA, MENSAJE_FALTA_REFERENCIA } from '../lib/requisitos'
import { pedido } from '../test/pedidos'
import type { Pedido, Producto } from '../types'

// ErrorApi se deja real: el formulario decide que mensaje mostrar segun la clase y el codigo del error
vi.mock('../lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/api')>()),
  api: { get: vi.fn(), postForm: vi.fn() },
}))

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

const productoPapeleria: Producto = {
  ...producto,
  _id: 'prod-2',
  nombre: 'Invitación bordada',
  categoria: { ...producto.categoria, _id: 'cat-2', nombre: 'Invitaciones', familia: 'papeleria' },
}

// fecha local YYYY-MM-DD a N dias de hoy, igual que la calcula el componente (sin pasar por UTC)
function fechaLocal(dias: number): string {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
}

// primera fecha a 7 dias o mas que no sea festivo, en el mismo formato que el componente
function fechaHabil(): string {
  for (let d = 7; ; d += 1) {
    const f = fechaLocal(d)
    if (!esFestivo(f)) return f
  }
}

const jpg = () => new File(['x'], 'ref.jpg', { type: 'image/jpeg' })

async function renderFormulario(ruta = '/pedido/prod-1') {
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/pedido/:productoId" element={<PedidoFormPage />} />
        <Route path="/catalogo" element={<p>catalogo</p>} />
      </Routes>
    </MemoryRouter>,
  )
  await screen.findByRole('button', { name: 'Enviar mi pedido' })
}

async function llenarObligatorios(
  opciones: { fecha?: boolean; hora?: boolean; celular?: boolean; referencia?: boolean } = {},
) {
  const { fecha = true, hora = true, celular = true, referencia = true } = opciones
  await userEvent.type(screen.getByLabelText('Descripción del pedido'), 'Feliz 15 Valentina')
  await userEvent.type(screen.getByLabelText('Colores'), 'dorado')
  await userEvent.type(screen.getByLabelText('Materiales'), 'acrílico espejo')
  if (fecha) fireEvent.change(screen.getByLabelText('Fecha en que la necesitas'), { target: { value: fechaHabil() } })
  if (hora) await userEvent.selectOptions(screen.getByLabelText('Hora en que la necesitas'), '10:00')
  if (celular) await userEvent.type(screen.getByLabelText('Tu celular'), '319 245 2842')
  if (referencia) await userEvent.upload(screen.getByLabelText(/Imágenes de referencia/), jpg())
}

function enviar() {
  return userEvent.click(screen.getByRole('button', { name: 'Enviar mi pedido' }))
}

function camposEnviados() {
  return vi.mocked(api.postForm).mock.calls[0][1]
}

beforeEach(() => {
  vi.mocked(api.get).mockReset().mockResolvedValue(producto)
  vi.mocked(api.postForm)
    .mockReset()
    .mockResolvedValue(pedido({ _id: 'pedido-1abcdef', nombre: producto.nombre }))
})

describe('PedidoFormPage', () => {
  it('carga el producto por el id de la ruta y aclara que enviar no compromete a nada', async () => {
    await renderFormulario()
    expect(api.get).toHaveBeenCalledWith('/productos/prod-1')
    expect(screen.getByText('Topper nombre en espejo dorado', { selector: 'p' })).toBeInTheDocument()
    expect(screen.getByText(/enviar no te compromete a nada/i)).toBeInTheDocument()
  })

  describe('dimension', () => {
    it('sin elegir medida base exige el valor en cm y no envia', async () => {
      await renderFormulario()
      await llenarObligatorios()
      await enviar()

      expect(screen.getByLabelText('Valor en cm')).toHaveAttribute('aria-invalid', 'true')
      expect(screen.getByLabelText('Valor en cm')).toHaveAccessibleDescription(
        'Nos falta la medida en centímetros. Sin ella no podemos calcular la proporción de tu pieza.',
      )
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
      expect(camposEnviados().get('dimensionValor')).toBe('22')
      expect(camposEnviados().get('esDimensionPersonalizada')).toBe('false')
    })
  })

  describe('fecha y hora', () => {
    async function conMedidaYTextos(opciones?: Parameters<typeof llenarObligatorios>[0]) {
      await renderFormulario()
      await userEvent.click(screen.getByLabelText('Media libra: 22 cm'))
      await llenarObligatorios(opciones)
    }

    it('exige la fecha: sin ella no envia y explica por que la pedimos', async () => {
      await conMedidaYTextos({ fecha: false })
      await enviar()

      expect(screen.getByLabelText('Fecha en que la necesitas')).toHaveAttribute('aria-invalid', 'true')
      expect(screen.getByLabelText('Fecha en que la necesitas')).toHaveAccessibleDescription(/no podemos saber si llegamos/)
      expect(api.postForm).not.toHaveBeenCalled()
    })

    it('exige la hora', async () => {
      await conMedidaYTextos({ hora: false })
      await enviar()

      expect(screen.getByLabelText('Hora en que la necesitas')).toHaveAttribute('aria-invalid', 'true')
      expect(api.postForm).not.toHaveBeenCalled()
    })

    it('rechaza una fecha pasada', async () => {
      await conMedidaYTextos({ fecha: false })
      fireEvent.change(screen.getByLabelText('Fecha en que la necesitas'), { target: { value: fechaLocal(-1) } })
      await enviar()

      expect(screen.getByLabelText('Fecha en que la necesitas')).toHaveAttribute('aria-invalid', 'true')
      expect(screen.getByLabelText('Fecha en que la necesitas')).toHaveAccessibleDescription(/a partir de/)
      expect(api.postForm).not.toHaveBeenCalled()
    })

    it('explica la fecha minima en palabras, no en formato ISO', async () => {
      vi.useFakeTimers({ toFake: ['Date'] })
      vi.setSystemTime(new Date('2026-09-28T10:00:00-05:00'))
      try {
        await conMedidaYTextos({ fecha: false })
        fireEvent.change(screen.getByLabelText('Fecha en que la necesitas'), { target: { value: '2026-09-27' } })
        await enviar()

        expect(screen.getByLabelText('Fecha en que la necesitas')).toHaveAccessibleDescription(
          'Esa fecha es muy pronto para producirla. Elige una a partir del martes, 29 de septiembre, que es lo mínimo que necesitamos.',
        )
      } finally {
        vi.useRealTimers()
      }
    })

    // 21:00 del 28 en Bogota ya es el 29 en UTC: "mañana" se cuenta en la hora del taller, no en la del dispositivo.
    // TZ del proceso forzada a UTC para que el caso distinga aunque la maquina de pruebas este en Bogota
    it('cuenta el dia minimo en hora de Colombia', async () => {
      // borrar TZ no devuelve la zona anterior en Node: se restaura la zona resuelta
      const tzOriginal = Intl.DateTimeFormat().resolvedOptions().timeZone
      vi.stubEnv('TZ', 'UTC') // escribe process.env.TZ, que Node aplica en caliente
      vi.useFakeTimers({ toFake: ['Date'] })
      vi.setSystemTime(new Date('2026-09-29T02:00:00Z'))
      try {
        await conMedidaYTextos({ fecha: false })
        const campoFecha = screen.getByLabelText('Fecha en que la necesitas')
        expect(campoFecha).toHaveAttribute('min', '2026-09-29')

        fireEvent.change(campoFecha, { target: { value: '2026-09-29' } })
        await enviar()
        expect(api.postForm).toHaveBeenCalledOnce()
      } finally {
        vi.useRealTimers()
        vi.stubEnv('TZ', tzOriginal)
      }
    })

    // el minimo es un dia de margen: hoy tampoco alcanza para producir
    it('rechaza la fecha de hoy', async () => {
      await conMedidaYTextos({ fecha: false })
      fireEvent.change(screen.getByLabelText('Fecha en que la necesitas'), { target: { value: fechaLocal(0) } })
      await enviar()

      expect(api.postForm).not.toHaveBeenCalled()
    })

    it('rechaza un festivo: el taller no atiende ese dia, pero un domingo comun si', async () => {
      // reloj fijo para que el festivo de referencia (12 de octubre de 2026) quede en el futuro del formulario
      vi.useFakeTimers({ toFake: ['Date'] })
      vi.setSystemTime(new Date('2026-09-28T10:00:00-05:00'))
      try {
        await conMedidaYTextos({ fecha: false })
        const campoFecha = screen.getByLabelText('Fecha en que la necesitas')

        fireEvent.change(campoFecha, { target: { value: '2026-10-12' } })
        await enviar()
        expect(campoFecha).toHaveAccessibleDescription(/es festivo/)
        expect(api.postForm).not.toHaveBeenCalled()

        fireEvent.change(campoFecha, { target: { value: '2026-10-11' } }) // domingo comun
        await enviar()
        expect(api.postForm).toHaveBeenCalledOnce()
      } finally {
        vi.useRealTimers()
      }
    })

    it('manda fecha y hora juntas como un instante ISO en hora de Colombia', async () => {
      await conMedidaYTextos()
      await enviar()

      expect(camposEnviados().get('fechaDeseada')).toBe(new Date(`${fechaHabil()}T10:00:00-05:00`).toISOString())
    })
  })

  describe('celular', () => {
    async function listoSalvoCelular() {
      await renderFormulario()
      await userEvent.click(screen.getByLabelText('Media libra: 22 cm'))
      await llenarObligatorios({ celular: false })
    }

    it('es obligatorio y explica para que lo usamos', async () => {
      await listoSalvoCelular()
      await enviar()

      expect(screen.getByLabelText('Tu celular')).toHaveAttribute('aria-invalid', 'true')
      expect(screen.getByLabelText('Tu celular')).toHaveAccessibleDescription(/número por el que te escribimos/)
      expect(api.postForm).not.toHaveBeenCalled()
    })

    it('uno incompleto no pasa', async () => {
      await listoSalvoCelular()
      await userEvent.type(screen.getByLabelText('Tu celular'), '319 245')
      await enviar()

      expect(api.postForm).not.toHaveBeenCalled()
    })

    it('acepta espacios, guiones y +57 y lo manda normalizado a 10 digitos', async () => {
      await listoSalvoCelular()
      await userEvent.type(screen.getByLabelText('Tu celular'), '+57 319-245-2842')
      await enviar()

      expect(camposEnviados().get('telefono')).toBe('3192452842')
    })
  })

  describe('entrega', () => {
    it('por defecto recoge en el taller y no pide direccion', async () => {
      await renderFormulario()
      expect(screen.getByLabelText('Lo recojo en el taller')).toBeChecked()
      expect(screen.queryByLabelText('Barrio o dirección')).not.toBeInTheDocument()
    })

    it('a domicilio pide el barrio o direccion, que puede quedar para despues, y lo manda', async () => {
      await renderFormulario()
      await userEvent.click(screen.getByLabelText('Media libra: 22 cm'))
      await userEvent.click(screen.getByLabelText('Lo quiero a domicilio en Neiva'))
      await userEvent.type(screen.getByLabelText('Barrio o dirección'), 'Cra 5 # 10-20')
      await llenarObligatorios()
      await enviar()

      expect(camposEnviados().get('entregaMetodo')).toBe('domicilio')
      expect(camposEnviados().get('entregaDetalle')).toBe('Cra 5 # 10-20')
    })

    it('limita el barrio o direccion a 200 caracteres, como el server', async () => {
      await renderFormulario()
      await userEvent.click(screen.getByLabelText('Lo quiero a domicilio en Neiva'))
      expect(screen.getByLabelText('Barrio o dirección')).toHaveAttribute('maxLength', '200')
    })

    it('si vuelve a recoger en el taller no manda la direccion que habia escrito', async () => {
      await renderFormulario()
      await userEvent.click(screen.getByLabelText('Media libra: 22 cm'))
      await userEvent.click(screen.getByLabelText('Lo quiero a domicilio en Neiva'))
      await userEvent.type(screen.getByLabelText('Barrio o dirección'), 'Cra 5 # 10-20')
      await userEvent.click(screen.getByLabelText('Lo recojo en el taller'))
      await llenarObligatorios()
      await enviar()

      expect(camposEnviados().get('entregaMetodo')).toBe('recoger')
      expect(camposEnviados().get('entregaDetalle')).toBe('')
    })
  })

  describe('imagen de referencia', () => {
    it('un topper sin imagen no envia y explica por que la necesitamos', async () => {
      await renderFormulario()
      await userEvent.click(screen.getByLabelText('Media libra: 22 cm'))
      await llenarObligatorios({ referencia: false })
      await enviar()

      expect(await screen.findByText(/sin verla no podemos cotizar/i)).toBeInTheDocument()
      expect(api.postForm).not.toHaveBeenCalled()
    })

    it('en papeleria la imagen es opcional', async () => {
      vi.mocked(api.get).mockResolvedValue(productoPapeleria)
      await renderFormulario('/pedido/prod-2')
      await userEvent.click(screen.getByLabelText('Media libra: 22 cm'))
      await llenarObligatorios({ referencia: false })
      await enviar()

      expect(api.postForm).toHaveBeenCalledOnce()
    })
  })

  it('marca los campos obligatorios vacios', async () => {
    await renderFormulario()
    await userEvent.click(screen.getByLabelText('Media libra: 22 cm'))
    await enviar()

    for (const campo of [
      'Descripción del pedido',
      'Colores',
      'Materiales',
      'Fecha en que la necesitas',
      'Hora en que la necesitas',
      'Tu celular',
    ]) {
      expect(screen.getByLabelText(campo)).toHaveAttribute('aria-invalid', 'true')
    }
    expect(api.postForm).not.toHaveBeenCalled()
  })

  it('tras un envio exitoso muestra el codigo, la promesa de contacto y el resumen para WhatsApp', async () => {
    await renderFormulario()
    await userEvent.click(screen.getByLabelText('Media libra: 22 cm'))
    await llenarObligatorios()
    await enviar()

    expect(await screen.findByText(codigoPedido('pedido-1abcdef'))).toBeInTheDocument()
    // el formulario se desmonta: el foco pasa al titulo para que el lector de pantalla anuncie el resultado
    expect(screen.getByRole('heading', { name: /recibimos tu solicitud/i })).toHaveFocus()
    expect(screen.getByText(/te escribimos por whatsapp/i)).toBeInTheDocument()
    expect(screen.getByText(/no empezamos a producir/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Enviar mi pedido' })).not.toBeInTheDocument()

    const enlaceWhatsApp = screen.getByRole('link', { name: 'Enviar el resumen por WhatsApp' })
    expect(enlaceWhatsApp).toHaveAttribute('href', expect.stringContaining('wa.me/573192452842'))
    const mensaje = decodeURIComponent(enlaceWhatsApp.getAttribute('href')!)
    expect(mensaje).toContain(codigoPedido('pedido-1abcdef'))
    expect(mensaje).toContain(producto.nombre)
  })

  describe('error al enviar', () => {
    async function enviarCon(error: unknown) {
      vi.mocked(api.postForm).mockRejectedValueOnce(error)
      await renderFormulario()
      await userEvent.click(screen.getByLabelText('Media libra: 22 cm'))
      await llenarObligatorios()
      await enviar()
      return screen.findByRole('alert')
    }

    it('muestra el mensaje del servidor en el 409 de pedido duplicado', async () => {
      const alerta = await enviarCon(new ErrorApi('Ya recibimos este mismo pedido hace un momento.', 409))
      expect(alerta).toHaveTextContent('Ya recibimos este mismo pedido')
    })

    it('muestra el mensaje del servidor en un 400 escrito para el cliente', async () => {
      const alerta = await enviarCon(new ErrorApi(MENSAJE_FALTA_REFERENCIA, 400))
      expect(alerta).toHaveTextContent('Sin verla no podemos cotizar')
    })

    // el server junta varios requisitos faltantes con un espacio
    it('muestra los requisitos que faltan aunque vengan juntos', async () => {
      const alerta = await enviarCon(new ErrorApi(`${MENSAJE_FALTA_FECHA} ${MENSAJE_FALTA_REFERENCIA}`, 400))
      expect(alerta).toHaveTextContent(MENSAJE_FALTA_FECHA)
      expect(alerta).toHaveTextContent(MENSAJE_FALTA_REFERENCIA)
    })

    it('un 400 con un mensaje conocido mas texto de sistema pegado no pasa', async () => {
      const alerta = await enviarCon(new ErrorApi(`${MENSAJE_FALTA_FECHA} detalle interno`, 400))
      expect(alerta).toHaveTextContent(/no pudimos enviar tu pedido/i)
    })

    it.each([
      ['una caida de red', new TypeError('Failed to fetch'), 'Failed to fetch'],
      ['un 400 generico', new ErrorApi('Datos del pedido inválidos', 400), 'inválidos'],
      ['un 500', new ErrorApi('Error 500', 500), 'Error 500'],
      ['un 400 de multer', new ErrorApi('Error al procesar imagen: Too many files', 400), 'Too many files'],
      ['un 400 del manejador de errores', new ErrorApi('Solicitud inválida', 400), 'Solicitud inválida'],
      ['un 400 sin cuerpo', new ErrorApi('Error 400', 400), 'Error 400'],
    ])('con %s muestra el mensaje de respaldo, no el texto crudo', async (_caso, error, crudo) => {
      const alerta = await enviarCon(error)
      expect(alerta).toHaveTextContent(/no pudimos enviar tu pedido/i)
      expect(alerta).not.toHaveTextContent(crudo)
    })
  })

  describe('Pedir de nuevo (?desde=)', () => {
    const anterior = {
      producto: { _id: producto._id, nombre: producto.nombre },
      dimensiones: { valor: 22, unidad: 'cm', esDimensionPersonalizada: false },
      descripcion: 'Feliz cumple Ana',
      cantidad: 2,
      colores: 'rosado',
      materiales: 'acrílico',
      contacto: { nombre: 'Ana', telefono: '3001234567' },
      entrega: { metodo: 'domicilio', detalle: 'Cra 5 # 10-20' },
    } as Pedido

    it('precarga medida, cantidad, textos, celular y entrega, sin fecha ni imagenes', async () => {
      vi.mocked(api.get).mockImplementation((path: string) =>
        path === '/pedidos/pedido-anterior' ? Promise.resolve(anterior) : Promise.resolve(producto),
      )
      await renderFormulario('/pedido/prod-1?desde=pedido-anterior')

      expect(await screen.findByLabelText('Descripción del pedido')).toHaveValue('Feliz cumple Ana')
      expect(screen.getByLabelText('Media libra: 22 cm')).toBeChecked()
      expect(screen.getByLabelText('Cantidad')).toHaveValue(2)
      expect(screen.getByLabelText('Colores')).toHaveValue('rosado')
      expect(screen.getByLabelText('Materiales')).toHaveValue('acrílico')
      expect(screen.getByLabelText('Tu celular')).toHaveValue('3001234567')
      expect(screen.getByLabelText('Lo quiero a domicilio en Neiva')).toBeChecked()
      expect(screen.getByLabelText('Barrio o dirección')).toHaveValue('Cra 5 # 10-20')
      expect(screen.getByLabelText('Fecha en que la necesitas')).toHaveValue('')
      expect(screen.getByText(/adjúntalas de nuevo/i)).toBeInTheDocument()
    })

    it('producto inactivo muestra el mensaje con enlace al catalogo', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('404'))
      render(
        <MemoryRouter initialEntries={['/pedido/prod-1?desde=pedido-anterior']}>
          <Routes>
            <Route path="/pedido/:productoId" element={<PedidoFormPage />} />
            <Route path="/catalogo" element={<p>catalogo</p>} />
          </Routes>
        </MemoryRouter>,
      )
      expect(await screen.findByText(/ya no está disponible/i)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /ir al catálogo/i })).toBeInTheDocument()
    })

    it('no precarga si el pedido de origen es de otro producto (?desde= manipulado a mano)', async () => {
      vi.mocked(api.get).mockImplementation((path: string) =>
        path === '/pedidos/pedido-anterior'
          ? Promise.resolve({ ...anterior, producto: { _id: 'otro-producto', nombre: 'Otro' } } as Pedido)
          : Promise.resolve(producto),
      )
      await renderFormulario('/pedido/prod-1?desde=pedido-anterior')

      expect(screen.getByLabelText('Descripción del pedido')).toHaveValue('')
    })

    it('pedido original ilegible abre el formulario vacio con un aviso', async () => {
      vi.mocked(api.get).mockImplementation((path: string) =>
        path === '/pedidos/pedido-anterior' ? Promise.reject(new Error('404')) : Promise.resolve(producto),
      )
      await renderFormulario('/pedido/prod-1?desde=pedido-anterior')

      expect(await screen.findByText(/no pudimos traer los datos de tu pedido anterior/i)).toBeInTheDocument()
      expect(screen.getByLabelText('Descripción del pedido')).toHaveValue('')
    })
  })
})
