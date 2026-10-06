import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { PedidoFormPage } from './PedidoFormPage'
import { api, ErrorApi } from '../lib/api'
import { esDiaConServicio, fechaEnPalabras } from '../lib/horario'
import { codigoPedido } from '../lib/pedido'
import { MENSAJE_CELULAR, MENSAJE_FALTA_REFERENCIA } from '../lib/requisitos'
import { MENSAJE_ERROR_ENVIO, MENSAJE_SESION_VENCIDA } from '../lib/errorEnvio'
import { useAuth } from '../contexts/AuthContext'
import { SnackbarProvider } from '../components/ui/Snackbar'
import { comprimirImagen } from '../lib/comprimirImagen'
import { pedido } from '../test/pedidos'
import type { Pedido, Producto } from '../types'

// ErrorApi se deja real: el formulario decide que mensaje mostrar segun la clase y el codigo del error
vi.mock('../lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/api')>()),
  api: { get: vi.fn(), postForm: vi.fn() },
}))
// el ingreso del dialogo de sesion vencida usa useAuth; aqui solo importa que login se llame
vi.mock('../contexts/AuthContext', () => ({ useAuth: vi.fn() }))
const login = vi.fn()
// la compresion real se prueba en su modulo; aqui pasa la imagen tal cual salvo el caso que la deja a medias
vi.mock('../lib/comprimirImagen', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/comprimirImagen')>()),
  comprimirImagen: vi.fn(async (f: File) => f),
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

// hace lo que el Atras/Adelante del navegador: volver a una entrada ?paso=4 del historial sin pasar por Siguiente
function SaltoAlRepaso() {
  const navigate = useNavigate()
  return (
    <button type="button" onClick={() => navigate({ search: '?paso=4' })}>
      historial al repaso
    </button>
  )
}

function montar(ruta: string) {
  return render(
    <SnackbarProvider>
      <MemoryRouter initialEntries={[ruta]}>
        <Routes>
          <Route path="/pedido/:productoId" element={<PedidoFormPage />} />
          <Route path="/catalogo" element={<p>catalogo</p>} />
        </Routes>
        <Ubicacion />
        <SaltoAlRepaso />
      </MemoryRouter>
    </SnackbarProvider>,
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
  await userEvent.click(screen.getByRole('radio', { name: fechaEnPalabras(fechaHabil()) }))
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
// el repaso ignora un envio en su primer medio segundo (doble toque en Siguiente): el reloj avanza un segundo,
// como el cliente que lee antes de enviar
function pasarLaGracia() {
  const ahora = Date.now()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(ahora + 1000)
}
async function llegarAlRepaso() {
  await hastaMomento3()
  await completarMomento3()
  await siguiente()
  await screen.findByRole('heading', { name: 'Repaso' })
  pasarLaGracia()
}
function camposEnviados() {
  return vi.mocked(api.postForm).mock.calls[0][1] as FormData
}

beforeEach(() => {
  login.mockReset()
  vi.mocked(useAuth).mockReturnValue({ usuario: null, autenticado: true, login, registrar: vi.fn(), logout: vi.fn() })
  vi.mocked(api.get).mockReset().mockResolvedValue(producto)
  vi.mocked(api.postForm).mockReset().mockResolvedValue(pedido({ _id: 'pedido-1abcdef', nombre: producto.nombre }))
  vi.mocked(comprimirImagen).mockReset().mockImplementation(async (f) => f)
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
    // dos anillos: el compacto del movil y el grande de escritorio (uno de los dos oculto por CSS)
    expect(screen.getAllByRole('img', { name: 'Paso 1 de 4: Qué necesitas' })).toHaveLength(2)

    await completarMomento1()
    await siguiente()

    expect(await screen.findAllByRole('img', { name: 'Paso 2 de 4: Cómo lo imaginas' })).toHaveLength(2)
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
    // sin tarjeta elegida no hay valor en cm a la vista: el error va en las tarjetas de medida
    expect(screen.queryByLabelText('Valor en cm')).not.toBeInTheDocument()
    const tarjeta = screen.getByRole('radio', { name: /Media libra/ })
    expect(tarjeta).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getAllByRole('alert')).toHaveLength(1)
    expect(tarjeta).toHaveFocus()
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

  // la hoja no puede decir "Pendiente" de una medida que si se envia
  it('Otra medida llega al repaso y al envio con su valor', async () => {
    await renderFormulario()
    await userEvent.click(screen.getByRole('radio', { name: /Otra medida/ }))
    await userEvent.type(screen.getByLabelText('Valor en cm'), '30')
    await userEvent.type(screen.getByLabelText('Colores'), 'dorado')
    await userEvent.type(screen.getByLabelText('Materiales'), 'acrílico espejo')
    await siguiente()
    await completarMomento2()
    await siguiente()
    await completarMomento3()
    await siguiente()
    await screen.findByRole('heading', { name: 'Repaso' })

    const hoja = screen.getByRole('region', { name: 'Tu solicitud' })
    expect(hoja).toHaveTextContent('30 cm (personalizada)')
    expect(hoja).not.toHaveTextContent('Pendiente')
    pasarLaGracia()
    await enviar()
    await screen.findByRole('heading', { name: 'Recibimos tu solicitud' })
    expect(camposEnviados().get('dimensionValor')).toBe('30')
    expect(camposEnviados().get('esDimensionPersonalizada')).toBe('true')
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

  it('mientras se prepara la imagen, Siguiente espera y dice por que; al terminar avanza con ella', async () => {
    let terminar: (f: File) => void = () => {}
    vi.mocked(comprimirImagen).mockImplementationOnce(() => new Promise<File>((r) => (terminar = r)))
    await renderFormulario()
    await completarMomento1()
    await siguiente()
    await screen.findByRole('heading', { name: 'Cómo lo imaginas' })
    await userEvent.type(screen.getByLabelText('Descripción del pedido'), 'Feliz 15 Valentina')
    await userEvent.upload(screen.getByLabelText(/Elige imágenes de referencia/i), jpg())

    const boton = screen.getByRole('button', { name: 'Siguiente' })
    await waitFor(() => expect(boton).toBeDisabled())
    expect(screen.getByText('Estamos preparando tu imagen…')).toBeInTheDocument()
    fireEvent.submit(boton.closest('form')!) // Enter en un campo
    expect(screen.getByRole('heading', { name: 'Cómo lo imaginas' })).toBeInTheDocument()
    expect(screen.queryByText(MENSAJE_FALTA_REFERENCIA)).not.toBeInTheDocument()

    terminar(jpg())
    await screen.findByText('ref.jpg')
    await waitFor(() => expect(boton).toBeEnabled())
    await siguiente()
    expect(await screen.findByRole('heading', { name: 'Cuándo y dónde' })).toBeInTheDocument()
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
    await completarMomento3()
    await siguiente()
    await screen.findByRole('heading', { name: 'Repaso' })
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
    const form = container.querySelector('form')!
    expect(form.className).toMatch(/pb-\[calc\(var\(--space-24\)\+var\(--space-8\)\+env\(safe-area-inset-bottom\)\)\]/)
    expect(form).toHaveClass('lg:pb-0')
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

  it('el calendario deja los domingos y los lunes festivos deshabilitados', async () => {
    await momento3ConRelojFijo()
    await userEvent.click(screen.getByRole('button', { name: 'Ver el calendario' }))
    // con el reloj en el 28 de septiembre el calendario abre en septiembre
    await userEvent.click(screen.getByRole('button', { name: 'Mes siguiente' }))

    expect(screen.getByRole('button', { name: 'domingo, 11 de octubre' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'lunes, 12 de octubre' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'martes, 13 de octubre' })).toBeEnabled()
  })

  it('una fecha lejana elegida en el calendario llega al repaso', async () => {
    await momento3ConRelojFijo()
    await userEvent.click(screen.getByRole('button', { name: 'Ver el calendario' }))
    await userEvent.click(screen.getByRole('button', { name: 'Mes siguiente' }))
    await userEvent.click(screen.getByRole('button', { name: 'Mes siguiente' }))
    await userEvent.click(screen.getByRole('button', { name: 'martes, 17 de noviembre' }))
    await userEvent.selectOptions(screen.getByLabelText('Hora en que la necesitas'), '10:00')
    await userEvent.type(screen.getByLabelText('Tu celular'), '319 245 2842')
    await siguiente()

    await screen.findByRole('heading', { name: 'Repaso' })
    expect(screen.getByText(/17 de noviembre/)).toBeInTheDocument()
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
    pasarLaGracia()
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
    pasarLaGracia()
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
    pasarLaGracia()
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

  it('un 401 abre el ingreso en un diálogo y, al ingresar, conserva lo escrito y permite reenviar', async () => {
    vi.mocked(api.postForm).mockRejectedValueOnce(new ErrorApi('Token inválido', 401))
    login.mockResolvedValueOnce({ _id: 'u1', nombre: 'Ana', email: 'ana@taju.co', rol: 'cliente' })
    await llegarAlRepaso()
    await enviar()

    const dialogo = await screen.findByRole('dialog', { name: 'Tu sesión venció' })
    expect(dialogo).toHaveTextContent(/tus datos siguen aquí/)
    expect(screen.getByRole('region', { name: 'Tu solicitud' })).toHaveTextContent('319 245 2842')

    await userEvent.type(within(dialogo).getByLabelText('Correo'), 'ana@taju.co')
    await userEvent.type(within(dialogo).getByLabelText('Contraseña'), 'clave-segura-123')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Ingresar' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.queryByText(MENSAJE_SESION_VENCIDA)).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Repaso' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Tu solicitud' })).toHaveTextContent('319 245 2842')

    await enviar()
    expect(await screen.findByRole('heading', { name: 'Recibimos tu solicitud' })).toBeInTheDocument()
    expect(api.postForm).toHaveBeenCalledTimes(2)
  })

  it('cerrar el diálogo con Escape no pierde lo escrito ni deja el aviso viejo', async () => {
    vi.mocked(api.postForm).mockRejectedValueOnce(new ErrorApi('Token inválido', 401))
    await llegarAlRepaso()
    await enviar()
    await screen.findByRole('dialog', { name: 'Tu sesión venció' })
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.queryByText(MENSAJE_SESION_VENCIDA)).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Tu solicitud' })).toHaveTextContent('319 245 2842')
  })

  it('otros errores no abren el diálogo', async () => {
    await enviarCon(new ErrorApi('boom', 500))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('un 400 de multer muestra el mensaje de respaldo, no el texto crudo', async () => {
    const alerta = await enviarCon(new ErrorApi('Error al procesar imagen: Too many files', 400))
    expect(alerta).toHaveTextContent(MENSAJE_ERROR_ENVIO)
    expect(alerta).not.toHaveTextContent('Too many files')
  })

  // "Enviar mi pedido" aparece en el mismo lugar que "Siguiente": un doble toque no puede saltarse el repaso.
  // Reloj quieto entre los dos toques = llegan dentro de la ventana de gracia
  it('un doble toque en Siguiente del momento 3 se queda en el repaso sin enviar', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-09-28T10:00:00-05:00'))
    await hastaMomento3()
    await completarMomento3()

    const boton = screen.getByRole('button', { name: 'Siguiente' })
    await userEvent.click(boton)
    await userEvent.click(boton)

    expect(await screen.findByRole('heading', { name: 'Repaso' })).toBeInTheDocument()
    expect(api.postForm).not.toHaveBeenCalled()

    vi.setSystemTime(new Date('2026-09-28T10:00:01-05:00'))
    await enviar()
    expect(await screen.findByRole('heading', { name: 'Recibimos tu solicitud' })).toBeInTheDocument()
    expect(api.postForm).toHaveBeenCalledOnce()
  })

  it('si al enviar falta un dato de un momento anterior, vuelve ahi con el foco en el campo marcado', async () => {
    await llegarAlRepaso()
    for (const momento of ['Cuándo y dónde', 'Cómo lo imaginas', 'Qué necesitas']) {
      await userEvent.click(screen.getByRole('button', { name: 'Atrás' }))
      await screen.findByRole('heading', { name: momento })
    }
    await userEvent.clear(screen.getByLabelText('Colores'))
    await userEvent.click(screen.getByRole('button', { name: 'historial al repaso' }))
    await screen.findByRole('heading', { name: 'Repaso' })
    pasarLaGracia()

    await enviar()

    expect(await screen.findByRole('heading', { name: 'Qué necesitas' })).toBeInTheDocument()
    const colores = screen.getByLabelText('Colores')
    expect(colores).toHaveAttribute('aria-invalid', 'true')
    await waitFor(() => expect(colores).toHaveFocus())
    expect(api.postForm).not.toHaveBeenCalled()
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
    expect(screen.queryByRole('radio', { name: /, \d+ de /, checked: true })).not.toBeInTheDocument()
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

describe('PedidoFormPage | maquetacion', () => {
  it('la columna del formulario puede encogerse (min-w-0) y el repaso no monta ninguna hoja fija', async () => {
    await llegarAlRepaso()
    expect(document.querySelector('form')).toHaveClass('min-w-0')
    // la unica hoja fija es la del aside (hidden en movil); el repaso trae la suya sin sticky
    const repaso = screen.getByRole('heading', { name: 'Repaso' }).closest('form')!
    expect(repaso.querySelector('[class*="lg:sticky"]')).toBeNull()
  })
})
