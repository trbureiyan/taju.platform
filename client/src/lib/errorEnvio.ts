import { ErrorApi } from './api'
import { MENSAJE_FALTA_FECHA, MENSAJE_FALTA_REFERENCIA, MENSAJE_FECHA_PASADA } from './requisitos'

export const MENSAJE_ERROR_ENVIO =
  'No pudimos enviar tu pedido porque algo falló en la conexión con el taller. Tus datos siguen aquí: prueba de nuevo en unos segundos o escríbenos por WhatsApp.'

export const MENSAJE_SESION_VENCIDA = 'Tu sesión venció. Ingresa de nuevo: tus datos siguen aquí.'

// mensajes de subida de server/src/middleware/upload.ts, escritos para el cliente
const MENSAJES_SUBIDA = new Set([
  'Cada imagen debe pesar menos de 5 MB',
  'Uno de los archivos no es una imagen JPG, PNG o WebP válida',
  'Solo se aceptan imágenes JPG, PNG o WebP',
])

// requisitos de server/src/modules/pedidos/pedidos.requisitos.ts; el del minimo lleva un numero, va como patron
const MENSAJES_FIJOS = [MENSAJE_FALTA_FECHA, MENSAJE_FALTA_REFERENCIA, MENSAJE_FECHA_PASADA]
const PATRON_MINIMO =
  /Este producto se pide desde \d+ unidades: el precio por escala solo aplica a partir de ahí\. Sube la cantidad o escríbenos por WhatsApp si necesitas menos\./g

// el server junta los requisitos faltantes con un espacio: pasa solo si el texto entero son requisitos conocidos
function sonSoloRequisitos(texto: string): boolean {
  let resto = texto.replace(PATRON_MINIMO, '')
  for (const m of MENSAJES_FIJOS) resto = resto.split(m).join('')
  return resto !== texto && resto.trim() === ''
}

/**
 * Texto a mostrar cuando falla el envio de la solicitud.
 * [DECISION] lista blanca que falla cerrada: el texto del server llega tal cual solo en el 409 o en un 400 conocido;
 * el 401 tiene texto propio (sesion vencida); red caida (TypeError), 5xx y cualquier otro 400 ("Solicitud inválida", errores de multer) reciben el de respaldo.
 * Si el server agrega un 400 escrito para el cliente, sumarlo aqui a mano o el cliente vera el de respaldo.
 */
export function mensajeDeErrorDeEnvio(err: unknown): string {
  if (!(err instanceof ErrorApi)) return MENSAJE_ERROR_ENVIO
  if (err.estado === 401) return MENSAJE_SESION_VENCIDA
  if (err.estado === 409) return err.message
  if (err.estado === 400 && (MENSAJES_SUBIDA.has(err.message) || sonSoloRequisitos(err.message))) return err.message
  return MENSAJE_ERROR_ENVIO
}
