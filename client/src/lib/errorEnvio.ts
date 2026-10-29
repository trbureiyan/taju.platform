import { ErrorApi } from './api'
import type { RazonRechazo } from './inspeccionarImagen'
import { MENSAJE_FALTA_FECHA, MENSAJE_FALTA_REFERENCIA, MENSAJE_FECHA_PASADA } from './requisitos'

export const MENSAJE_ERROR_ENVIO =
  'No pudimos enviar tu pedido porque algo falló en la conexión con el taller. Tus datos siguen aquí: prueba de nuevo en unos segundos o escríbenos por WhatsApp.'

export const MENSAJE_SESION_VENCIDA = 'Tu sesión venció. Ingresa de nuevo: tus datos siguen aquí.'

// mensajes de subida de server/src/middleware/upload.ts y de lib/cloudinary.ts, escritos para el cliente, con la razon
// del aviso de fotos (AvisoImagenDialog) a la que corresponde: cambian aqui y alla letra por letra
const MENSAJES_SUBIDA = new Map<string, RazonRechazo>([
  ['Cada imagen debe pesar menos de 5 MB', 'peso'],
  ['Una de tus imágenes tiene demasiados píxeles. Redúcela o envíanosla por WhatsApp.', 'pixeles'],
  ['No pudimos leer una de tus imágenes. Prueba con otra en JPG, PNG o WebP.', 'ilegible'],
  ['No pudimos procesar una de tus imágenes. Prueba con otra o escríbenos por WhatsApp.', 'ilegible'],
  ['Uno de los archivos no es una imagen JPG, PNG o WebP válida', 'formato'],
  ['Solo se aceptan imágenes JPG, PNG o WebP', 'formato'],
])

// topes de subidas de server/src/middleware/limitarSubidasEnCurso.ts (429 por cuenta, 503 en total)
const MENSAJES_TOPE_SUBIDAS = new Set([
  'Ya estamos recibiendo las fotos de tu pedido. Espera unos segundos antes de volver a enviarlo.',
  'El taller está recibiendo muchas fotos a la vez. Intenta de nuevo en un minuto.',
])

/**
 * Razon del aviso de fotos cuando el servidor rechazo una imagen del envio (400 con un texto de subida conocido).
 * @returns La razon, o null si el error no es de imagen.
 */
export function razonDeErrorDeImagen(err: unknown): RazonRechazo | null {
  if (!(err instanceof ErrorApi) || err.estado !== 400) return null
  return MENSAJES_SUBIDA.get(err.message) ?? null
}

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
  if ((err.estado === 429 || err.estado === 503) && MENSAJES_TOPE_SUBIDAS.has(err.message)) return err.message
  if (err.estado === 400 && (MENSAJES_SUBIDA.has(err.message) || sonSoloRequisitos(err.message))) return err.message
  return MENSAJE_ERROR_ENVIO
}
