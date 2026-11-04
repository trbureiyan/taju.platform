import { describe, it, expect } from 'vitest'
import { ErrorApi } from './api'
import { mensajeDeErrorDeEnvio, razonDeErrorDeImagen, MENSAJE_ERROR_ENVIO, MENSAJE_SESION_VENCIDA } from './errorEnvio'
import { MENSAJE_FALTA_FECHA, MENSAJE_FALTA_REFERENCIA, MENSAJE_FECHA_PASADA, mensajeCantidadMinima } from './requisitos'

const error = (estado: number, mensaje: string) => new ErrorApi(mensaje, estado)

describe('razonDeErrorDeImagen', () => {
  it.each([
    ['Cada imagen debe pesar menos de 5 MB', 'peso'],
    ['Una de tus imágenes tiene demasiados píxeles. Redúcela o envíanosla por WhatsApp.', 'pixeles'],
    ['No pudimos leer una de tus imágenes. Prueba con otra en JPG, PNG o WebP.', 'ilegible'],
    ['No pudimos procesar una de tus imágenes. Prueba con otra o escríbenos por WhatsApp.', 'ilegible'],
    ['Uno de los archivos no es una imagen JPG, PNG o WebP válida', 'formato'],
    ['Solo se aceptan imágenes JPG, PNG o WebP', 'formato'],
  ])('un 400 con "%s" es de imagen: razón %s', (mensaje, razon) => {
    expect(razonDeErrorDeImagen(error(400, mensaje))).toBe(razon)
  })

  it('no es de imagen: un 400 de requisitos, otro estado o un error que no es de la API', () => {
    expect(razonDeErrorDeImagen(error(400, MENSAJE_FALTA_FECHA))).toBeNull()
    expect(razonDeErrorDeImagen(error(500, 'Cada imagen debe pesar menos de 5 MB'))).toBeNull()
    expect(razonDeErrorDeImagen(new TypeError('Failed to fetch'))).toBeNull()
  })
})

describe('mensajeDeErrorDeEnvio', () => {
  it('un 409 muestra el texto del servidor (duplicado, etc.)', () => {
    expect(mensajeDeErrorDeEnvio(error(409, 'Ya recibimos este mismo pedido hace un momento.'))).toBe(
      'Ya recibimos este mismo pedido hace un momento.',
    )
  })

  it('un 401 dice que la sesión venció y que los datos siguen', () => {
    expect(mensajeDeErrorDeEnvio(error(401, 'Token inválido'))).toBe(MENSAJE_SESION_VENCIDA)
    expect(MENSAJE_SESION_VENCIDA).toMatch(/Tu sesión venció/)
    expect(MENSAJE_SESION_VENCIDA).toMatch(/tus datos siguen aquí/)
  })

  it.each([
    'Cada imagen debe pesar menos de 5 MB',
    'Una de tus imágenes tiene demasiados píxeles. Redúcela o envíanosla por WhatsApp.',
    'No pudimos leer una de tus imágenes. Prueba con otra en JPG, PNG o WebP.',
    'No pudimos procesar una de tus imágenes. Prueba con otra o escríbenos por WhatsApp.',
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

  it.each([
    [429, 'Ya estamos recibiendo las fotos de tu pedido. Espera unos segundos antes de volver a enviarlo.'],
    [503, 'El taller está recibiendo muchas fotos a la vez. Intenta de nuevo en un minuto.'],
  ])('un %i conocido del tope de subidas pasa con su texto', (estado, mensaje) => {
    expect(mensajeDeErrorDeEnvio(error(estado, mensaje))).toBe(mensaje)
  })

  it('un 503 o 429 con otro texto cae al mensaje propio', () => {
    expect(mensajeDeErrorDeEnvio(error(503, 'Service Unavailable'))).toBe(MENSAJE_ERROR_ENVIO)
    expect(mensajeDeErrorDeEnvio(error(429, 'Recibimos muchas solicitudes seguidas desde tu conexión.'))).toBe(MENSAJE_ERROR_ENVIO)
  })

  it('un fallo de red, un 500 o cualquier otra cosa dan el mensaje propio', () => {
    expect(mensajeDeErrorDeEnvio(new TypeError('Failed to fetch'))).toBe(MENSAJE_ERROR_ENVIO)
    expect(mensajeDeErrorDeEnvio(error(500, 'Error interno del servidor'))).toBe(MENSAJE_ERROR_ENVIO)
    expect(mensajeDeErrorDeEnvio('algo')).toBe(MENSAJE_ERROR_ENVIO)
  })
})
