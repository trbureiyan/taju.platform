import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { PedidoFormPage } from './PedidoFormPage'
import { api, ErrorApi } from '../lib/api'
import { esDiaConServicio } from '../lib/horario'
import { codigoPedido } from '../lib/pedido'
import { MENSAJE_CELULAR, MENSAJE_FALTA_REFERENCIA } from '../lib/requisitos'
import { MENSAJE_ERROR_ENVIO } from '../lib/errorEnvio'
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

const productoSuperficies: Producto = {
  ...producto,
  _id: 'prod-3',
  nombre: 'Blonda grabada',
  categoria: { ...producto.categoria, _id: 'cat-3', nombre: 'Blondas', familia: 'superficies' },
  precio: { unitario: null, escalas: [{ cantidadMinima: 12, precioUnitario: 9000 }] },
}

// primera fecha a 7 dias o mas en que el taller atiende, en el mismo formato que el componente
function fechaHabil(): string {
  for (let d = 7; ; d += 1) {
    const f = new Date(Date.now() + d * 86_400_000).toISOString().slice(0, 10)
    if (esDiaConServicio(f)) return f
  }
}

const jpg = () => new File(['x'], 'ref.jpg', { type: 'image/jpeg' })

// deja la busqueda actual en el DOM para verificar ?paso=
function Ubicacion() {
  return <output data-testid="ubicacion">{useLocation().search}</output>
}

function montar(ruta: string) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/pedido/:productoId" element={<PedidoFormPage />} />
        <Route path="/catalogo" element={<p>catalogo</p>} />
      </Routes>
      <Ubicacion />
    </MemoryRouter>,
  )
}

async function renderFormulario(ruta = '/pedido/prod-1') {
  const vista = montar(ruta)
  await screen.findByRole('heading', { name: 'Qué necesitas' })
  return vista
}

const siguiente = () => userEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
const enviar = () => userEvent.click(screen.getByRole('button', { name: 'Enviar mi pedido' }))

async function subirReferencia() {
  await userEvent.upload(screen.getByLabelText(/Elige imágenes de referencia/i), jpg())
  await screen.findByText('ref.jpg')
}
async function completarMomento1() {
  await userEvent.click(screen.getByRole('radio', { name: /Media libra/ }))
  await userEvent.type(screen.getByLabelText('Colores'), 'dorado')
  await userEvent.type(screen.getByLabelText('Materiales'), 'acrílico espejo')
}
async function completarMomento2(opciones: { referencia?: boolean } = {}) {
  const { referencia = true } = opciones
  if (referencia) await subirReferencia()
  await userEvent.type(screen.getByLabelText('Descripción del pedido'), 'Feliz 15 Valentina')
}
async function completarMomento3(opciones: { celular?: string } = {}) {
  const { celular = '319 245 2842' } = opciones
  fireEvent.change(screen.getByLabelText('Otra fecha'), { target: { value: fechaHabil() } })
  await userEvent.selectOptions(screen.getByLabelText('Hora en que la necesitas'), '10:00')
  await userEvent.type(screen.getByLabelText('Tu celular'), celular)
}
async function hastaMomento3() {
  await renderFormulario()
  await completarMomento1()
  await siguiente()
  await screen.findByRole('heading', { name: 'Cómo lo imaginas' })
  await completarMomento2()
  await siguiente()
  await screen.findByRole('heading', { name: 'Cuándo y dónde' })
}
async function llegarAlRepaso() {
  await hastaMomento3()
  await completarMomento3()
  await siguiente()
  await screen.findByRole('heading', { name: 'Repaso' })
}
function camposEnviados() {
  return vi.mocked(api.postForm).mock.calls[0][1] as FormData
}

beforeEach(() => {
  vi.mocked(api.get).mockReset().mockResolvedValue(producto)
  vi.mocked(api.postForm).mockReset().mockResolvedValue(pedido({ _id: 'pedido-1abcdef', nombre: producto.nombre }))
  URL.createObjectURL = vi.fn(() => 'blob:vista-previa')
  URL.revokeObjectURL = vi.fn()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('PedidoFormPage | recorrido', () => {
  it('recorre los cuatro momentos y envia la solicitud completa', async () => {
    await llegarAlRepaso()
    const hoja = screen.getByRole('region', { name: 'Tu solicitud' })
    expect(hoja).toHaveTextContent(producto.nombre)
    expect(hoja).toHaveTextContent('319 245 2842')

    await enviar()

    expect(await screen.findByRole('heading', { name: 'Recibimos tu solicitud' })).toBeInTheDocument()
    expect(api.postForm).toHaveBeenCalledOnce()
    expect(api.postForm).toHaveBeenCalledWith('/pedidos', expect.any(FormData))
    const fd = camposEnviados()
    expect(fd.get('telefono')).toBe('3192452842')
    expect(fd.get('entregaMetodo')).toBe('recoger')
    expect(fd.get('fechaDeseada')).toBe(new Date(`${fechaHabil()}T10:00:00-05:00`).toISOString())
    expect(fd.get('dimensionValor')).toBe('22')
    expect(fd.getAll('imagenes')).toHaveLength(1)
    expect(screen.getByText(codigoPedido('pedido-1abcdef'))).toBeInTheDocument()
  })

  it('el anillo dice el paso y el momento, y el paso queda en la URL', async () => {
    await renderFormulario()
    expect(screen.getAllByRole('img', { name: 'Paso 1 de 4: Qué necesitas' }).length).toBeGreaterThan(0)

    await completarMomento1()
    await siguiente()

    expect(await screen.findAllByRole('img', { name: 'Paso 2 de 4: Cómo lo imaginas' })).not.toHaveLength(0)
    expect(screen.getByTestId('ubicacion')).toHaveTextContent('?paso=2')
  })

  it('carga el producto por el id de la ruta', async () => {
    await renderFormulario()
    expect(api.get).toHaveBeenCalledWith('/productos/prod-1')
    expect(screen.getByText(producto.nombre, { selector: 'p' })).toBeInTheDocument()
  })

  it('el momento 1 incompleto no avanza: un solo aviso y el foco en el primer campo marcado', async () => {
    await renderFormulario()
    await siguiente()

    expect(screen.getByRole('heading', { name: 'Qué necesitas' })).toBeInTheDocument()
    const valor = screen.getByLabelText('Valor en cm')
    expect(valor).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getAllByRole('alert')).toHaveLength(1)
    expect(valor).toHaveFocus()
  })

  // el aviso se remonta en cada intento fallido: un lector de pantalla lo vuelve a anunciar aunque el texto no cambie
  it('un segundo intento fallido identico vuelve a anunciar el aviso', async () => {
    await renderFormulario()
    await siguiente()
    const primero = screen.getByRole('alert')

    await siguiente()
    const segundo = screen.getByRole('alert')
    expect(segundo).toHaveTextContent(primero.textContent!)
    expect(segundo).not.toBe(primero)
    expect(primero).not.toBeInTheDocument()
  })

  // [Review Focus] el minimo por escala se avisa antes del POST, igual que lo exige el servidor
  it('superficies con 5 unidades no avanza y explica el minimo; con 12 si', async () => {
    vi.mocked(api.get).mockResolvedValue(productoSuperficies)
    await renderFormulario('/pedido/prod-3')

    await userEvent.click(screen.getByRole('radio', { name: /Otra medida/ }))
    await userEvent.type(screen.getByLabelText('Valor en cm'), '30')
    const cantidad = screen.getByLabelText('Cantidad')
    await userEvent.clear(cantidad)
    await userEvent.type(cantidad, '5')
    await userEvent.type(screen.getByLabelText('Colores'), 'blanco')
    await userEvent.type(screen.getByLabelText('Materiales'), 'MDF')
    await siguiente()

    expect(screen.getByRole('heading', { name: 'Qué necesitas' })).toBeInTheDocument()
    expect(cantidad).toHaveAccessibleDescription(/Este producto se pide desde 12 unidades/)
    expect(cantidad).toHaveAccessibleDescription(/precio por escala/)

    await userEvent.clear(cantidad)
    await userEvent.type(cantidad, '12')
    await siguiente()
    expect(await screen.findByRole('heading', { name: 'Cómo lo imaginas' })).toBeInTheDocument()
  })

  it('un topper sin referencia no avanza y el error queda enlazado a la zona', async () => {
    await renderFormulario()
    await completarMomento1()
    await siguiente()
    await completarMomento2({ referencia: false })
    await siguiente()

    expect(screen.getByRole('heading', { name: 'Cómo lo imaginas' })).toBeInTheDocument()
    expect(screen.getByLabelText(/Elige imágenes de referencia/i)).toHaveAccessibleDescription(MENSAJE_FALTA_REFERENCIA)
  })

  it('en papeleria la referencia es opcional y avanza sin imagen', async () => {
    vi.mocked(api.get).mockResolvedValue(productoPapeleria)
    await renderFormulario('/pedido/prod-2')
    await completarMomento1()
    await siguiente()
    await completarMomento2({ referencia: false })
    await siguiente()

    expect(await screen.findByRole('heading', { name: 'Cuándo y dónde' })).toBeInTheDocument()
  })

  it('Atras vuelve al momento anterior con los datos conservados y el foco en su titulo', async () => {
    await renderFormulario()
    await completarMomento1()
    await siguiente()
    await screen.findByRole('heading', { name: 'Cómo lo imaginas' })

    await userEvent.click(screen.getByRole('button', { name: 'Atrás' }))

    const titulo = await screen.findByRole('heading', { name: 'Qué necesitas' })
    expect(screen.getByLabelText('Colores')).toHaveValue('dorado')
    expect(titulo).toHaveFocus()
  })

  it('al cambiar de momento el foco pasa al titulo, pero la primera vista no lo roba', async () => {
    await renderFormulario()
    expect(screen.getByRole('heading', { name: 'Qué necesitas' })).not.toHaveFocus()

    await completarMomento1()
    await siguiente()
    expect(await screen.findByRole('heading', { name: 'Cómo lo imaginas' })).toHaveFocus()
  })

  // [Review Focus] abrir o recargar ?paso=4 no salta los momentos sin validar
  it('?paso=4 directo muestra el momento 1', async () => {
    await renderFormulario('/pedido/prod-1?paso=4')
    expect(screen.getByRole('heading', { name: 'Qué necesitas' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Repaso' })).not.toBeInTheDocument()
  })

  it('cada momento trae su enlace de dudas', async () => {
    await renderFormulario()
    expect(screen.getByRole('link', { name: /Dudas/ })).toBeInTheDocument()
    await completarMomento1()
    await siguiente()
    await screen.findByRole('heading', { name: 'Cómo lo imaginas' })
    expect(screen.getByRole('link', { name: /Dudas/ })).toBeInTheDocument()
    await completarMomento2()
    await siguiente()
    await screen.findByRole('heading', { name: 'Cuándo y dónde' })
    expect(screen.getByRole('link', { name: /Dudas/ })).toBeInTheDocument()
  })

  it('la hoja lateral existe solo antes del repaso; en el repaso la hoja es el contenido', async () => {
    const { container } = await renderFormulario()
    expect(container.querySelector('aside')).not.toBeNull()
    expect(screen.getAllByRole('region', { name: 'Tu solicitud' })).toHaveLength(1)

    await completarMomento1()
    await siguiente()
    await completarMomento2()
    await siguiente()
    await completarMomento3()
    await siguiente()
    await screen.findByRole('heading', { name: 'Repaso' })

    expect(container.querySelector('aside')).toBeNull()
    expect(screen.getAllByRole('region', { name: 'Tu solicitud' })).toHaveLength(1)
  })

  it('el formulario deja espacio abajo para la barra fija del movil', async () => {
    const { container } = await renderFormulario()
    expect(container.querySelector('form')).toHaveClass('pb-24', 'lg:pb-0')
  })
})

describe('PedidoFormPage | fecha', () => {
  // reloj fijo: lunes 28 de septiembre de 2026, 10 a. m. en Bogota; el 12 de octubre es lunes festivo
  async function momento3ConRelojFijo() {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-09-28T10:00:00-05:00'))
    await hastaMomento3()
  }

  it('la tira no ofrece domingos ni lunes festivos', async () => {
    await momento3ConRelojFijo()
    expect(screen.queryAllByRole('radio', { name: /^domingo/ })).toHaveLength(0)
    expect(screen.queryByRole('radio', { name: 'lunes, 12 de octubre' })).not.toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'martes, 13 de octubre' })).toBeInTheDocument()
  })

  it('otra fecha en domingo lo explica y no deja avanzar', async () => {
    await momento3ConRelojFijo()
    const otra = screen.getByLabelText('Otra fecha')
    fireEvent.change(otra, { target: { value: '2026-10-11' } })
    await userEvent.type(screen.getByLabelText('Tu celular'), '319 245 2842')
    await siguiente()

    expect(otra).toHaveAccessibleDescription(/Los domingos no hay servicio/)
    expect(screen.getByRole('heading', { name: 'Cuándo y dónde' })).toBeInTheDocument()
  })

  it('otra fecha en un lunes festivo dice que el taller esta cerrado', async () => {
    await momento3ConRelojFijo()
    const otra = screen.getByLabelText('Otra fecha')
    fireEvent.change(otra, { target: { value: '2026-10-12' } })
    await siguiente()

    expect(otra).toHaveAccessibleDescription(/festivo y el taller está cerrado/)
    expect(screen.getByRole('heading', { name: 'Cuándo y dónde' })).toBeInTheDocument()
  })

  it('el sabado ofrece horas hasta las 3 p. m.', async () => {
    await momento3ConRelojFijo()
    await userEvent.click(screen.getByRole('radio', { name: 'sábado, 3 de octubre' }))
    const horas = Array.from(screen.getByLabelText('Hora en que la necesitas').querySelectorAll('option')).map(
      (o) => o.textContent,
    )
    expect(horas[horas.length - 1]).toBe('3:00 p. m.')
    expect(horas).not.toContain('4:00 p. m.')
  })
})

describe('PedidoFormPage | celular y entrega', () => {
  it('acepta +57 con guiones y lo envia normalizado a 10 digitos', async () => {
    await hastaMomento3()
    await completarMomento3({ celular: '+57 319-245-2842' })
    await siguiente()
    await screen.findByRole('heading', { name: 'Repaso' })
    await enviar()

    await screen.findByRole('heading', { name: 'Recibimos tu solicitud' })
    expect(camposEnviados().get('telefono')).toBe('3192452842')
  })

  it('un celular incompleto da el mensaje de 10 digitos y no avanza', async () => {
    await hastaMomento3()
    await completarMomento3({ celular: '319 245' })
    await siguiente()

    expect(screen.getByLabelText('Tu celular')).toHaveAccessibleDescription(MENSAJE_CELULAR)
    expect(screen.getByRole('heading', { name: 'Cuándo y dónde' })).toBeInTheDocument()
  })

  it('pide la direccion solo a domicilio y la envia', async () => {
    await hastaMomento3()
    expect(screen.queryByLabelText('Barrio o dirección')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('radio', { name: /A domicilio en Neiva/ }))
    await userEvent.type(screen.getByLabelText('Barrio o dirección'), 'Cra 5 # 10-20')
    await completarMomento3()
    await siguiente()
    await screen.findByRole('heading', { name: 'Repaso' })
    await enviar()

    await screen.findByRole('heading', { name: 'Recibimos tu solicitud' })
    expect(camposEnviados().get('entregaMetodo')).toBe('domicilio')
    expect(camposEnviados().get('entregaDetalle')).toBe('Cra 5 # 10-20')
  })

  it('si vuelve a recoger no envia la direccion que habia escrito', async () => {
    await hastaMomento3()
    await userEvent.click(screen.getByRole('radio', { name: /A domicilio en Neiva/ }))
    await userEvent.type(screen.getByLabelText('Barrio o dirección'), 'Cra 5 # 10-20')
    await userEvent.click(screen.getByRole('radio', { name: /Lo recojo en el taller/ }))
    expect(screen.queryByLabelText('Barrio o dirección')).not.toBeInTheDocument()
    await completarMomento3()
    await siguiente()
    await screen.findByRole('heading', { name: 'Repaso' })
    await enviar()

    await screen.findByRole('heading', { name: 'Recibimos tu solicitud' })
    expect(camposEnviados().get('entregaMetodo')).toBe('recoger')
    expect(camposEnviados().get('entregaDetalle')).toBe('')
  })
})

describe('PedidoFormPage | envio', () => {
  async function enviarCon(error: unknown) {
    vi.mocked(api.postForm).mockRejectedValueOnce(error)
    await llegarAlRepaso()
    await enviar()
    return screen.findByRole('alert')
  }

  it('una caida de red muestra el mensaje de respaldo y los datos siguen', async () => {
    const alerta = await enviarCon(new TypeError('Failed to fetch'))
    expect(alerta).toHaveTextContent(MENSAJE_ERROR_ENVIO)
    expect(screen.getByRole('heading', { name: 'Repaso' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Tu solicitud' })).toHaveTextContent('319 245 2842')
    expect(screen.getByRole('button', { name: 'Enviar mi pedido' })).toBeEnabled()
  })

  it('el 409 muestra el texto del servidor', async () => {
    const alerta = await enviarCon(new ErrorApi('Ya recibimos este mismo pedido hace un momento.', 409))
    expect(alerta).toHaveTextContent('Ya recibimos este mismo pedido hace un momento.')
  })

  it('un 400 de multer muestra el mensaje de respaldo, no el texto crudo', async () => {
    const alerta = await enviarCon(new ErrorApi('Error al procesar imagen: Too many files', 400))
    expect(alerta).toHaveTextContent(MENSAJE_ERROR_ENVIO)
    expect(alerta).not.toHaveTextContent('Too many files')
  })

  it('dos clics seguidos envian una sola vez', async () => {
    let resolver: (p: Pedido) => void = () => {}
    vi.mocked(api.postForm).mockReturnValueOnce(new Promise<Pedido>((r) => (resolver = r)))
    await llegarAlRepaso()

    const boton = screen.getByRole('button', { name: 'Enviar mi pedido' })
    fireEvent.click(boton)
    fireEvent.click(boton)

    expect(api.postForm).toHaveBeenCalledOnce()
    expect(await screen.findByRole('button', { name: 'Enviando tu pedido…' })).toBeDisabled()

    resolver(pedido({ _id: 'pedido-1abcdef', nombre: producto.nombre }))
    expect(await screen.findByRole('heading', { name: 'Recibimos tu solicitud' })).toBeInTheDocument()
    expect(api.postForm).toHaveBeenCalledOnce()
  })
})

describe('PedidoFormPage | pantalla de exito', () => {
  it('anuncia el resultado, promete el contacto, resume lo enviado y ofrece el resumen por WhatsApp', async () => {
    await llegarAlRepaso()
    await enviar()

    const titulo = await screen.findByRole('heading', { name: 'Recibimos tu solicitud' })
    // el formulario se desmonta: el foco pasa al titulo para que el lector de pantalla anuncie el resultado
    expect(titulo).toHaveFocus()
    expect(screen.getByText(/te escribimos por whatsapp/i)).toBeInTheDocument()
    expect(screen.getByText(/no empezamos a producir/i)).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Lo que enviaste' })).toHaveTextContent(producto.nombre)
    expect(screen.queryByRole('button', { name: 'Enviar mi pedido' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ver mis pedidos' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Seguir viendo el catálogo' })).toBeInTheDocument()

    const enlace = screen.getByRole('link', { name: 'Enviar el resumen por WhatsApp' })
    const mensaje = decodeURIComponent(enlace.getAttribute('href')!)
    expect(mensaje).toContain(codigoPedido('pedido-1abcdef'))
    expect(mensaje).toContain(producto.nombre)
  })

  // una solicitud sin fecha o con un celular que no es de 10 digitos no se muestra como "Pendiente":
  // ya se envio, no queda nada por responder
  it('el resumen de lo enviado omite las lineas sin valor en vez de marcarlas pendientes', async () => {
    vi.mocked(api.postForm).mockResolvedValue(
      pedido({
        _id: 'pedido-1abcdef',
        nombre: producto.nombre,
        fechaDeseada: null,
        contacto: { nombre: 'Laura', telefono: '60887123' },
      }),
    )
    await llegarAlRepaso()
    await enviar()

    const hoja = await screen.findByRole('region', { name: 'Lo que enviaste' })
    expect(hoja).not.toHaveTextContent('Pendiente')
    expect(hoja).not.toHaveTextContent('Fecha deseada')
    expect(hoja).not.toHaveTextContent('Celular')
    expect(hoja).toHaveTextContent('Colores')
  })
})

describe('PedidoFormPage | Pedir de nuevo (?desde=)', () => {
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

  function conAnterior(origen: () => Promise<Pedido>) {
    vi.mocked(api.get).mockImplementation((path: string) =>
      path === '/pedidos/pedido-anterior' ? origen() : Promise.resolve(producto),
    )
  }

  it('precarga medida, cantidad, textos, celular y entrega, sin fecha ni imagenes', async () => {
    conAnterior(() => Promise.resolve(anterior))
    await renderFormulario('/pedido/prod-1?desde=pedido-anterior')

    await waitFor(() => expect(screen.getByLabelText('Colores')).toHaveValue('rosado'))
    expect(screen.getByRole('radio', { name: /Media libra/ })).toBeChecked()
    expect(screen.getByLabelText('Cantidad')).toHaveValue(2)
    expect(screen.getByLabelText('Materiales')).toHaveValue('acrílico')
    await siguiente()

    await screen.findByRole('heading', { name: 'Cómo lo imaginas' })
    expect(screen.getByLabelText('Descripción del pedido')).toHaveValue('Feliz cumple Ana')
    expect(screen.getByText(/adjúntalas de nuevo/i)).toBeInTheDocument()
    expect(screen.queryByText('ref.jpg')).not.toBeInTheDocument()
    await subirReferencia()
    await siguiente()

    await screen.findByRole('heading', { name: 'Cuándo y dónde' })
    expect(screen.getByLabelText('Tu celular')).toHaveValue('3001234567')
    expect(screen.getByRole('radio', { name: /A domicilio en Neiva/ })).toBeChecked()
    expect(screen.getByLabelText('Barrio o dirección')).toHaveValue('Cra 5 # 10-20')
    expect(screen.getByLabelText('Otra fecha')).toHaveValue('')
  })

  it('no precarga si el pedido de origen es de otro producto (?desde= manipulado a mano)', async () => {
    conAnterior(() => Promise.resolve({ ...anterior, producto: { _id: 'otro-producto', nombre: 'Otro' } } as Pedido))
    await renderFormulario('/pedido/prod-1?desde=pedido-anterior')

    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/pedidos/pedido-anterior'))
    expect(screen.getByLabelText('Colores')).toHaveValue('')
    expect(screen.getByLabelText('Cantidad')).toHaveValue(1)
  })

  it('pedido original ilegible abre el formulario vacio con un aviso', async () => {
    conAnterior(() => Promise.reject(new Error('404')))
    await renderFormulario('/pedido/prod-1?desde=pedido-anterior')

    expect(await screen.findByText(/no pudimos traer los datos de tu pedido anterior/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Colores')).toHaveValue('')
  })
})

describe('PedidoFormPage | producto no disponible', () => {
  it('sin ?desde= dice que no lo encontramos y enlaza al catalogo', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('404'))
    montar('/pedido/prod-1')
    expect(await screen.findByText(/No encontramos este producto/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ir al catálogo/i })).toHaveAttribute('href', '/catalogo')
  })

  it('desde "Pedir de nuevo" dice que ya no esta disponible y enlaza al catalogo', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('404'))
    montar('/pedido/prod-1?desde=pedido-anterior')
    expect(await screen.findByText(/ya no está disponible/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ir al catálogo/i })).toHaveAttribute('href', '/catalogo')
  })
})
