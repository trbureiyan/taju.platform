import { describe, it, expect } from 'vitest'
import { CAMPOS_INICIALES, validarMomento, type Campos } from './validarSolicitud'
import { mensajeCantidadMinima, MENSAJE_FALTA_REFERENCIA } from './requisitos'
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
const superficies: Producto = {
  ...producto,
  categoria: { ...producto.categoria, familia: 'superficies', dimensionesBase: [] },
  precio: { unitario: null, escalas: [{ cantidadMinima: 12, precioUnitario: 9000 }] },
}

const lunes = new Date('2026-09-28T10:00:00-05:00') // primer dia disponible: martes 29
const completos: Campos = {
  ...CAMPOS_INICIALES,
  dimensionSeleccionada: 'Media libra',
  colores: 'dorado',
  materiales: 'acrílico',
  descripcion: 'Feliz 15 Valentina',
  fechaDeseada: '2026-10-06',
  horaDeseada: '10:00',
  telefono: '319 245 2842',
}
const imagen = new File(['x'], 'ref.jpg', { type: 'image/jpeg' })

describe('momento 1: que necesitas', () => {
  it('con todo completo no hay errores', () => {
    expect(validarMomento(1, completos, [], producto, lunes)).toEqual({})
  })

  it('sin medida elegida exige el valor en cm', () => {
    const e = validarMomento(1, { ...completos, dimensionSeleccionada: '' }, [], producto, lunes)
    expect(e.dimensionCustom).toMatch(/Nos falta la medida en centímetros/)
  })

  it('rechaza una medida personalizada de 0', () => {
    const e = validarMomento(1, { ...completos, dimensionSeleccionada: 'personalizada', dimensionCustom: '0' }, [], producto, lunes)
    expect(e.dimensionCustom).toMatch(/mayor a 0/)
  })

  it.each([['1.5', /números enteros/], ['0', /al menos 1 pieza/], ['', /al menos 1 pieza/]])('cantidad %j', (cantidad, mensaje) => {
    expect(validarMomento(1, { ...completos, cantidad }, [], producto, lunes).cantidad).toMatch(mensaje)
  })

  it('pide colores y materiales', () => {
    const e = validarMomento(1, { ...completos, colores: ' ', materiales: '' }, [], producto, lunes)
    expect(e.colores).toBeDefined()
    expect(e.materiales).toBeDefined()
  })

  // [Review Focus] superficies por debajo del minimo: el error sale al salir del momento 1, no al final
  it('superficies con 5 unidades: dice que paso, por que (precio por escala) y que hacer', () => {
    const e = validarMomento(1, { ...completos, dimensionSeleccionada: 'personalizada', dimensionCustom: '30', cantidad: '5' }, [], superficies, lunes)
    expect(e.cantidad).toBe(mensajeCantidadMinima(12))
    expect(e.cantidad).toMatch(/desde 12 unidades/)
    expect(e.cantidad).toMatch(/precio por escala/)
  })

  it('superficies con 12 unidades avanza', () => {
    const e = validarMomento(1, { ...completos, dimensionSeleccionada: 'personalizada', dimensionCustom: '30', cantidad: '12' }, [], superficies, lunes)
    expect(e.cantidad).toBeUndefined()
  })
})

describe('momento 2: como lo imaginas', () => {
  it('un topper exige referencia', () => {
    expect(validarMomento(2, completos, [], producto, lunes).archivos).toBe(MENSAJE_FALTA_REFERENCIA)
    expect(validarMomento(2, completos, [imagen], producto, lunes).archivos).toBeUndefined()
  })

  it('las demas familias no exigen referencia', () => {
    const papeleria = { ...producto, categoria: { ...producto.categoria, familia: 'papeleria' as const } }
    expect(validarMomento(2, completos, [], papeleria, lunes).archivos).toBeUndefined()
  })

  it('exige la descripcion', () => {
    expect(validarMomento(2, { ...completos, descripcion: ' ' }, [imagen], producto, lunes).descripcion).toMatch(/Cuéntanos qué necesitas/)
  })
})

describe('momento 3: cuando y donde', () => {
  it('con fecha, hora y celular validos no hay errores', () => {
    expect(validarMomento(3, completos, [], producto, lunes)).toEqual({})
  })

  it('usa la regla unica de fecha: un domingo no pasa', () => {
    expect(validarMomento(3, { ...completos, fechaDeseada: '2026-10-11' }, [], producto, lunes).fechaDeseada).toMatch(/Los domingos no hay servicio/)
  })

  it('exige la hora y valida que exista ese dia (el sabado termina a las 3 p. m.)', () => {
    expect(validarMomento(3, { ...completos, horaDeseada: '' }, [], producto, lunes).horaDeseada).toMatch(/Elige la hora/)
    const sabado = validarMomento(3, { ...completos, fechaDeseada: '2026-10-10', horaDeseada: '17:00' }, [], producto, lunes)
    expect(sabado.horaDeseada).toMatch(/no está disponible ese día/)
  })

  it('sin fecha valida no pide la hora: el error de fecha ya lo dice y el selector de hora esta apagado', () => {
    const sinFecha = validarMomento(3, { ...completos, fechaDeseada: '', horaDeseada: '' }, [], producto, lunes)
    expect(sinFecha.fechaDeseada).toBeDefined()
    expect(sinFecha.horaDeseada).toBeUndefined()
    const domingo = validarMomento(3, { ...completos, fechaDeseada: '2026-10-11', horaDeseada: '' }, [], producto, lunes)
    expect(domingo.fechaDeseada).toBeDefined()
    expect(domingo.horaDeseada).toBeUndefined()
  })

  it('acepta el celular con espacios, guiones o +57 y rechaza uno incompleto', () => {
    expect(validarMomento(3, { ...completos, telefono: '+57 319-245-2842' }, [], producto, lunes).telefono).toBeUndefined()
    expect(validarMomento(3, { ...completos, telefono: '319 245' }, [], producto, lunes).telefono).toMatch(/10 dígitos/)
  })
})
