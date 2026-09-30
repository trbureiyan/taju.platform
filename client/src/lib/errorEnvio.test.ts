import { describe, it, expect } from 'vitest'
import { ErrorApi } from './api'
import { mensajeDeErrorDeEnvio, MENSAJE_ERROR_ENVIO } from './errorEnvio'
import { MENSAJE_FALTA_FECHA, MENSAJE_FALTA_REFERENCIA, MENSAJE_FECHA_PASADA, mensajeCantidadMinima } from './requisitos'

const error = (estado: number, mensaje: string) => new ErrorApi(mensaje, estado)

describe('mensajeDeErrorDeEnvio', () => {
  it('un 409 muestra el texto del servidor (duplicado, etc.)', () => {
    expect(mensajeDeErrorDeEnvio(error(409, 'Ya recibimos este mismo pedido hace un momento.'))).toBe(
      'Ya recibimos este mismo pedido hace un momento.',
    )
  })

  it.each([
    'Cada imagen debe pesar menos de 5 MB',
    'Uno de los archivos no es una imagen JPG, PNG o WebP válida',
    'Solo se aceptan imágenes JPG, PNG o WebP',
    MENSAJE_FALTA_FECHA,
    MENSAJE_FALTA_REFERENCIA,
    MENSAJE_FECHA_PASADA,
    mensajeCantidadMinima(12),
  ])('un 400 conocido, escrito para el cliente, pasa: %s', (mensaje) => {
    expect(mensajeDeErrorDeEnvio(error(400, mensaje))).toBe(mensaje)
  })

  it('varios requisitos juntos (el servidor los une con un espacio) pasan', () => {
    const junto = `${MENSAJE_FALTA_REFERENCIA} ${mensajeCantidadMinima(12)}`
    expect(mensajeDeErrorDeEnvio(error(400, junto))).toBe(junto)
  })

  it.each([
    'Error al procesar imagen: Too many files',
    'Solicitud inválida',
    'Datos del pedido inválidos',
    'Error 400',
  ])('un 400 que no esta en la lista cae al mensaje propio: %s', (mensaje) => {
    expect(mensajeDeErrorDeEnvio(error(400, mensaje))).toBe(MENSAJE_ERROR_ENVIO)
  })

  it('un texto conocido con algo mas pegado no pasa (falla cerrado)', () => {
    expect(mensajeDeErrorDeEnvio(error(400, `${MENSAJE_FALTA_FECHA} stack trace`))).toBe(MENSAJE_ERROR_ENVIO)
  })

  it('un fallo de red, un 500 o cualquier otra cosa dan el mensaje propio', () => {
    expect(mensajeDeErrorDeEnvio(new TypeError('Failed to fetch'))).toBe(MENSAJE_ERROR_ENVIO)
    expect(mensajeDeErrorDeEnvio(error(500, 'Error interno del servidor'))).toBe(MENSAJE_ERROR_ENVIO)
    expect(mensajeDeErrorDeEnvio('algo')).toBe(MENSAJE_ERROR_ENVIO)
  })
})
