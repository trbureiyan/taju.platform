import type { Producto } from '../types'
import { horasDeEntrega } from './horario'
import { validarFechaDeseada } from './fechaDeseada'
import {
  cantidadMinimaDe,
  exigeReferencia,
  MENSAJE_CELULAR,
  MENSAJE_FALTA_REFERENCIA,
  mensajeCantidadMinima,
  normalizarCelular,
  REGEX_CELULAR,
} from './requisitos'

export interface Campos {
  dimensionSeleccionada: string
  dimensionCustom: string
  descripcion: string
  cantidad: string
  colores: string
  materiales: string
  telefono: string
  entregaMetodo: string
  entregaDetalle: string
  fechaDeseada: string
  horaDeseada: string
}

export type Errores = Partial<Record<keyof Campos | 'archivos', string>>

export const CAMPOS_INICIALES: Campos = {
  dimensionSeleccionada: '',
  dimensionCustom: '',
  descripcion: '',
  cantidad: '1',
  colores: '',
  materiales: '',
  telefono: '',
  entregaMetodo: 'recoger',
  entregaDetalle: '',
  fechaDeseada: '',
  horaDeseada: '',
}

export const MENSAJE_FALTA_MEDIDA =
  'Nos falta la medida de tu pieza. Elige una medida sugerida o marca Otra medida y escríbela en centímetros: la necesitamos para cotizar y producir.'

/**
 * Si la medida pedida es la que escribe el cliente en centimetros. Unica regla para el formulario, el resumen y el
 * envio: con medidas sugeridas solo "Otra medida" lo es (no haber elegido ninguna es un dato que falta); sin
 * medidas sugeridas siempre lo es.
 */
export function esMedidaPersonalizada(dimensionSeleccionada: string, producto: Producto): boolean {
  return producto.categoria.dimensionesBase.length === 0 || dimensionSeleccionada === 'personalizada'
}

export const MOMENTOS = [
  { numero: 1, titulo: 'Qué necesitas' },
  { numero: 2, titulo: 'Cómo lo imaginas' },
  { numero: 3, titulo: 'Cuándo y dónde' },
  { numero: 4, titulo: 'Repaso' },
] as const

/**
 * Valida un momento del formulario. Espejo de crearPedidoSchema y pedidos.requisitos del servidor: mismas reglas,
 * para dar feedback antes del POST. El momento 4 (repaso) no tiene campos propios.
 * @param ahora - Momento actual; el minimo de fecha se cuenta en dias con servicio y hora de Bogota.
 */
export function validarMomento(
  numero: 1 | 2 | 3,
  campos: Campos,
  archivos: File[],
  producto: Producto,
  ahora: Date,
): Errores {
  const e: Errores = {}

  if (numero === 1) {
    const personalizada = esMedidaPersonalizada(campos.dimensionSeleccionada, producto)
    if (!personalizada && !campos.dimensionSeleccionada) {
      e.dimensionSeleccionada = MENSAJE_FALTA_MEDIDA
    } else if (personalizada && !campos.dimensionCustom.trim()) {
      e.dimensionCustom = 'Nos falta la medida en centímetros. Sin ella no podemos calcular la proporción de tu pieza.'
    } else if (personalizada && parseFloat(campos.dimensionCustom) <= 0) {
      e.dimensionCustom = 'Necesitamos una medida mayor a 0 para calcular tu pieza. Escríbela en centímetros.'
    }
    const cantidad = Number(campos.cantidad)
    const minimo = cantidadMinimaDe(producto.precio)
    if (campos.cantidad.trim() !== '' && !Number.isInteger(cantidad)) {
      e.cantidad = 'Las piezas se piden completas. Escribe la cantidad en números enteros, por ejemplo 2.'
    } else if (!campos.cantidad.trim() || cantidad < 1) {
      e.cantidad = 'Necesitamos al menos 1 pieza para cotizar tu pedido. Escribe cuántas quieres.'
    } else if (cantidad < minimo) {
      e.cantidad = mensajeCantidadMinima(minimo)
    }
    if (!campos.colores.trim()) e.colores = 'Indica los colores que quieres. Los necesitamos para cotizar y producir.'
    if (!campos.materiales.trim()) {
      e.materiales = 'Indica el material. Si no lo sabes, cuéntanos para qué lo vas a usar y te asesoramos.'
    }
  }

  if (numero === 2) {
    if (exigeReferencia(producto.categoria.familia) && archivos.length === 0) e.archivos = MENSAJE_FALTA_REFERENCIA
    if (!campos.descripcion.trim()) e.descripcion = 'Cuéntanos qué necesitas. Con eso podemos cotizarlo.'
  }

  if (numero === 3) {
    const errorFecha = validarFechaDeseada(campos.fechaDeseada, ahora)
    if (errorFecha) {
      // con la fecha en error el selector de hora esta apagado y este mensaje ya dice que hacer: no se suma otro
      e.fechaDeseada = errorFecha
    } else if (!campos.horaDeseada) {
      e.horaDeseada = 'Elige la hora en que la necesitas. Con ella coordinamos la entrega.'
    } else if (!horasDeEntrega(campos.fechaDeseada).includes(Number(campos.horaDeseada.slice(0, 2)))) {
      e.horaDeseada = 'Esa hora no está disponible ese día. Elige otra de la lista.'
    }
    if (!REGEX_CELULAR.test(normalizarCelular(campos.telefono))) e.telefono = MENSAJE_CELULAR
  }

  return e
}
