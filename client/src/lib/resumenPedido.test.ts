import { describe, it, expect } from 'vitest'
import { resumenDesdeCampos, resumenDesdePedido } from './resumenPedido'
import { pedido } from '../test/pedidos'
import type { Producto } from '../types'

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

const vacios = {
  dimensionSeleccionada: '', dimensionCustom: '', cantidad: '1', colores: '', materiales: '', descripcion: '',
  entregaMetodo: 'recoger', entregaDetalle: '', fechaDeseada: '', horaDeseada: '', telefono: '',
}

const valor = (lineas: ReturnType<typeof resumenDesdeCampos>, clave: string) => lineas.find((l) => l.clave === clave)?.valor

describe('resumenDesdeCampos', () => {
  it('lo que falta queda como pendiente (null), no como texto vacio', () => {
    const lineas = resumenDesdeCampos(vacios, producto, { cantidad: 0, obligatoria: true })
    expect(valor(lineas, 'producto')).toBe('Topper nombre en espejo dorado')
    expect(valor(lineas, 'medida')).toBeNull()
    expect(valor(lineas, 'colores')).toBeNull()
    expect(valor(lineas, 'referencias')).toBeNull()
    expect(valor(lineas, 'fecha')).toBeNull()
    expect(valor(lineas, 'celular')).toBeNull()
  })

  it('arma medida, entrega, fecha con hora y celular legibles', () => {
    const lineas = resumenDesdeCampos(
      {
        ...vacios,
        dimensionSeleccionada: 'Media libra',
        cantidad: '2',
        colores: 'dorado',
        materiales: 'acrílico',
        descripcion: 'Feliz 15',
        entregaMetodo: 'domicilio',
        entregaDetalle: 'Barrio Cándido',
        fechaDeseada: '2026-10-05',
        horaDeseada: '10:00',
        telefono: '319 245 2842',
      },
      producto,
      { cantidad: 2, obligatoria: true },
    )
    expect(valor(lineas, 'medida')).toBe('22 cm')
    expect(valor(lineas, 'cantidad')).toBe('2')
    expect(valor(lineas, 'entrega')).toBe('a domicilio (Barrio Cándido)')
    expect(valor(lineas, 'fecha')).toBe('lunes, 5 de octubre, 10:00 a. m.')
    expect(valor(lineas, 'celular')).toBe('319 245 2842')
    expect(valor(lineas, 'referencias')).toBe('2 imágenes')
  })

  it('una medida personalizada se marca como tal', () => {
    const lineas = resumenDesdeCampos({ ...vacios, dimensionSeleccionada: 'personalizada', dimensionCustom: '25' }, producto, { cantidad: 0, obligatoria: false })
    expect(valor(lineas, 'medida')).toBe('25 cm (personalizada)')
  })

  // sin tarjeta elegida en un producto con medidas sugeridas no hay medida (no se envia: la validacion la pide)
  it('sin tarjeta elegida la medida queda pendiente aunque haya un valor en cm viejo', () => {
    const lineas = resumenDesdeCampos({ ...vacios, dimensionCustom: '25' }, producto, { cantidad: 0, obligatoria: false })
    expect(valor(lineas, 'medida')).toBeNull()
  })

  it('sin medidas sugeridas el valor en cm es la medida', () => {
    const sinBase = { ...producto, categoria: { ...producto.categoria, dimensionesBase: [] } }
    const lineas = resumenDesdeCampos({ ...vacios, dimensionCustom: '25' }, sinBase, { cantidad: 0, obligatoria: false })
    expect(valor(lineas, 'medida')).toBe('25 cm (personalizada)')
  })

  it('con el dia elegido y sin hora muestra el dia y que falta la hora', () => {
    const lineas = resumenDesdeCampos({ ...vacios, fechaDeseada: '2026-10-05' }, producto, { cantidad: 0, obligatoria: false })
    expect(valor(lineas, 'fecha')).toBe('lunes, 5 de octubre, hora pendiente')
  })

  it('sin referencias y sin obligacion dice "Sin imágenes", no pendiente', () => {
    const lineas = resumenDesdeCampos(vacios, producto, { cantidad: 0, obligatoria: false })
    expect(valor(lineas, 'referencias')).toBe('Sin imágenes')
  })
})

describe('resumenDesdePedido', () => {
  it('sale del pedido ya creado, sin pendientes', () => {
    const lineas = resumenDesdePedido(pedido({ nombre: 'Topper luna', entrega: { metodo: 'recoger', detalle: '' } }))
    expect(lineas.every((l) => l.valor !== null)).toBe(true)
    expect(valor(lineas, 'entrega')).toBe('la recojo en el taller')
    expect(valor(lineas, 'celular')).toBe('319 245 2842')
  })
})
