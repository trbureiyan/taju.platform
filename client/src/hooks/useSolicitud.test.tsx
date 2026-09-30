import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useSolicitud } from './useSolicitud'
import { api, ErrorApi } from '../lib/api'
import { MENSAJE_ERROR_ENVIO } from '../lib/errorEnvio'
import { mensajeCantidadMinima } from '../lib/requisitos'
import { pedido } from '../test/pedidos'
import type { Producto } from '../types'

vi.mock('../lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/api')>()),
  api: { get: vi.fn(), postForm: vi.fn() },
}))

const producto: Producto = {
  _id: 'prod-1',
  nombre: 'Topper nombre en espejo dorado',
  descripcionTecnica: '',
  categoria: { _id: 'cat-1', nombre: 'Toppers de acrílico', familia: 'papeleria', dimensionesBase: [{ etiqueta: 'Media libra', valor: 22, unidad: 'cm' }] },
  especificacionesTecnicas: {},
  imagenes: [],
  precio: { unitario: 35000, escalas: [] },
  activo: true,
}

function envoltura(ruta = '/pedido/prod-1') {
  return ({ children }: { children: ReactNode }) => <MemoryRouter initialEntries={[ruta]}>{children}</MemoryRouter>
}

// devuelve el hook y la busqueda actual de la URL para verificar ?paso=
function montar(ruta?: string, p: Producto | null = producto) {
  return renderHook(() => ({ s: useSolicitud(p), url: useLocation().search }), { wrapper: envoltura(ruta) })
}

function llenarMomento1(r: ReturnType<typeof montar>) {
  act(() => {
    r.result.current.s.set('dimensionSeleccionada', 'Media libra')
    r.result.current.s.set('colores', 'dorado')
    r.result.current.s.set('materiales', 'acrílico')
  })
}
function llenarMomento2(r: ReturnType<typeof montar>) {
  act(() => r.result.current.s.set('descripcion', 'Feliz 15'))
}
function llenarMomento3(r: ReturnType<typeof montar>) {
  act(() => {
    r.result.current.s.set('fechaDeseada', '2099-01-05')
    r.result.current.s.set('horaDeseada', '10:00')
    r.result.current.s.set('telefono', '3192452842')
  })
}

beforeEach(() => {
  vi.mocked(api.postForm).mockReset().mockResolvedValue(pedido({ _id: 'pedido-1abcdef' }))
})

describe('useSolicitud: pasos y URL', () => {
  it('arranca en el momento 1', () => {
    expect(montar().result.current.s.paso).toBe(1)
  })

  // [Review Focus] abrir ?paso=4 directo o recargar a mitad: vuelve al momento que corresponde
  it('un ?paso= al que aun no se llega vuelve al 1', () => {
    expect(montar('/pedido/prod-1?paso=4').result.current.s.paso).toBe(1)
    expect(montar('/pedido/prod-1?paso=abc').result.current.s.paso).toBe(1)
    expect(montar('/pedido/prod-1?paso=0').result.current.s.paso).toBe(1)
  })

  it('siguiente con errores no avanza, marca los campos y sube el contador de fallos', () => {
    const r = montar()
    let avanzo = true
    act(() => { avanzo = r.result.current.s.siguiente() })
    expect(avanzo).toBe(false)
    expect(r.result.current.s.paso).toBe(1)
    expect(r.result.current.s.errores.colores).toBeDefined()
    expect(r.result.current.s.fallos).toBe(1)
  })

  it('siguiente con el momento completo avanza y lo escribe en la URL', () => {
    const r = montar()
    llenarMomento1(r)
    act(() => { r.result.current.s.siguiente() })
    expect(r.result.current.s.paso).toBe(2)
    expect(r.result.current.url).toContain('paso=2')
  })

  it('atras vuelve al momento anterior', () => {
    const r = montar()
    llenarMomento1(r)
    act(() => { r.result.current.s.siguiente() })
    act(() => r.result.current.s.atras())
    expect(r.result.current.s.paso).toBe(1)
  })

  it('escribir en un campo limpia su error', () => {
    const r = montar()
    act(() => { r.result.current.s.siguiente() })
    act(() => r.result.current.s.set('colores', 'dorado'))
    expect(r.result.current.s.errores.colores).toBeUndefined()
  })

  it('limpiar un error borra la clave: Object.keys cuenta solo errores reales', () => {
    const r = montar()
    act(() => { r.result.current.s.siguiente() })
    const antes = Object.keys(r.result.current.s.errores).length
    act(() => r.result.current.s.set('colores', 'dorado'))
    expect('colores' in r.result.current.s.errores).toBe(false)
    expect(Object.keys(r.result.current.s.errores)).toHaveLength(antes - 1)
  })

  it('cambiarArchivos limpia el error de archivos', () => {
    const topper: Producto = { ...producto, categoria: { ...producto.categoria, familia: 'toppers' } }
    const r = montar('/pedido/prod-1', topper)
    llenarMomento1(r)
    act(() => { r.result.current.s.siguiente() })
    act(() => { r.result.current.s.siguiente() })
    expect(r.result.current.s.errores.archivos).toBeDefined()
    act(() => r.result.current.s.cambiarArchivos([new File(['x'], 'ref.jpg', { type: 'image/jpeg' })]))
    expect('archivos' in r.result.current.s.errores).toBe(false)
  })

  it('irAlPaso conserva los demas parametros de la URL', () => {
    const r = montar('/pedido/prod-1?desde=abc')
    llenarMomento1(r)
    act(() => { r.result.current.s.siguiente() })
    expect(r.result.current.url).toContain('desde=abc')
    expect(r.result.current.url).toContain('paso=2')
  })

  it('superficies con 5 unidades no sale del momento 1', () => {
    const superficies: Producto = {
      ...producto,
      categoria: { ...producto.categoria, familia: 'superficies', dimensionesBase: [] },
      precio: { unitario: null, escalas: [{ cantidadMinima: 12, precioUnitario: 9000 }] },
    }
    const r = montar('/pedido/prod-1', superficies)
    act(() => {
      r.result.current.s.set('dimensionCustom', '30')
      r.result.current.s.set('cantidad', '5')
      r.result.current.s.set('colores', 'dorado')
      r.result.current.s.set('materiales', 'mdf')
    })
    act(() => { r.result.current.s.siguiente() })
    expect(r.result.current.s.paso).toBe(1)
    expect(r.result.current.s.errores.cantidad).toBe(mensajeCantidadMinima(12))
  })
})

describe('useSolicitud: envio', () => {
  function llegarAlRepaso(r: ReturnType<typeof montar>) {
    llenarMomento1(r)
    act(() => { r.result.current.s.siguiente() })
    llenarMomento2(r)
    act(() => { r.result.current.s.siguiente() })
    llenarMomento3(r)
    act(() => { r.result.current.s.siguiente() })
  }

  it('llega al repaso (momento 4) cuando los tres momentos estan completos', async () => {
    const r = montar()
    llegarAlRepaso(r)
    expect(r.result.current.s.paso).toBe(4)
  })

  it('enviar manda la solicitud con los campos nuevos y devuelve el pedido', async () => {
    const r = montar()
    llegarAlRepaso(r)
    let creado: unknown = null
    await act(async () => { creado = await r.result.current.s.enviar() })
    expect(creado).toMatchObject({ _id: 'pedido-1abcdef' })
    const cuerpo = vi.mocked(api.postForm).mock.calls[0][1] as FormData
    expect(cuerpo.get('telefono')).toBe('3192452842')
    expect(cuerpo.get('entregaMetodo')).toBe('recoger')
    expect(cuerpo.get('entregaDetalle')).toBe('')
    expect(cuerpo.get('fechaDeseada')).toBe(new Date('2099-01-05T10:00:00-05:00').toISOString())
    expect(cuerpo.get('dimensionValor')).toBe('22')
  })

  it('no manda a la direccion escrita si volvio a "recoger"', async () => {
    const r = montar()
    llegarAlRepaso(r)
    act(() => {
      r.result.current.s.set('entregaMetodo', 'domicilio')
      r.result.current.s.set('entregaDetalle', 'Barrio Cándido')
      r.result.current.s.set('entregaMetodo', 'recoger')
    })
    await act(async () => { await r.result.current.s.enviar() })
    expect((vi.mocked(api.postForm).mock.calls[0][1] as FormData).get('entregaDetalle')).toBe('')
  })

  it('un doble envio seguido manda una sola solicitud', async () => {
    const r = montar()
    llegarAlRepaso(r)
    await act(async () => {
      await Promise.all([r.result.current.s.enviar(), r.result.current.s.enviar()])
    })
    expect(api.postForm).toHaveBeenCalledTimes(1)
  })

  it('enviar con un momento incompleto vuelve a ese momento en lugar de mandar', async () => {
    const r = montar()
    llenarMomento1(r)
    act(() => { r.result.current.s.siguiente() })
    // se llega al paso 2 pero se envia sin descripcion ni momento 3
    await act(async () => { await r.result.current.s.enviar() })
    expect(api.postForm).not.toHaveBeenCalled()
    expect(r.result.current.s.paso).toBe(2)
    expect(r.result.current.s.errores.descripcion).toBeDefined()
  })

  it('enviar desde el paso 2 con el momento 3 incompleto lleva al paso 3 con sus errores', async () => {
    const r = montar()
    llenarMomento1(r)
    act(() => { r.result.current.s.siguiente() })
    llenarMomento2(r)
    await act(async () => { await r.result.current.s.enviar() })
    expect(api.postForm).not.toHaveBeenCalled()
    expect(r.result.current.s.paso).toBe(3)
    expect(r.result.current.url).toContain('paso=3')
    expect(r.result.current.s.errores.telefono).toBeDefined()
  })

  it('si armar la solicitud falla, el formulario no queda bloqueado', async () => {
    const r = montar()
    llegarAlRepaso(r)
    // fecha con formato roto: pasa la regla de fecha pero no arma un instante valido
    act(() => r.result.current.s.set('fechaDeseada', '2099-1-5'))
    let resultado: unknown = 'sin llamar'
    await act(async () => { resultado = await r.result.current.s.enviar() })
    expect(resultado).toBeNull()
    expect(r.result.current.s.errorEnvio).toBe(MENSAJE_ERROR_ENVIO)
    expect(r.result.current.s.enviando).toBe(false)
    act(() => r.result.current.s.set('fechaDeseada', '2099-01-05'))
    let creado: unknown = null
    await act(async () => { creado = await r.result.current.s.enviar() })
    expect(creado).toMatchObject({ _id: 'pedido-1abcdef' })
  })

  it('un fallo de red muestra el mensaje propio, no el texto crudo, y conserva los datos', async () => {
    vi.mocked(api.postForm).mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const r = montar()
    llegarAlRepaso(r)
    await act(async () => { await r.result.current.s.enviar() })
    expect(r.result.current.s.errorEnvio).toBe(MENSAJE_ERROR_ENVIO)
    expect(r.result.current.s.campos.colores).toBe('dorado')
  })

  it('un 409 muestra el texto del servidor', async () => {
    vi.mocked(api.postForm).mockRejectedValueOnce(new ErrorApi('Ya recibimos este mismo pedido hace un momento.', 409))
    const r = montar()
    llegarAlRepaso(r)
    await act(async () => { await r.result.current.s.enviar() })
    expect(r.result.current.s.errorEnvio).toBe('Ya recibimos este mismo pedido hace un momento.')
  })
})
