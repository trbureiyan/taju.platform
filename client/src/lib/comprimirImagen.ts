import {
  ErrorImagen,
  inspeccionarArchivo,
  MENSAJE_FORMATO_IMAGEN,
  MENSAJE_IMAGEN_ILEGIBLE,
  type InspeccionImagen,
} from './inspeccionarImagen'

// las fotos de un celular pesan 3 a 25 MB y el servidor recibe hasta 5 MB: se reducen aqui, en el navegador,
// antes de subirlas. Se aceptan hasta 25 MB de entrada porque la reduccion cubre la diferencia. El servidor sigue
// verificando tipo, firma, peso y pixeles; esto solo evita rechazos evitables.

export { ErrorImagen, MENSAJE_FORMATO_IMAGEN, MENSAJE_IMAGEN_ILEGIBLE }

export const TIPOS_IMAGEN_ACEPTADOS: readonly string[] = ['image/jpeg', 'image/png', 'image/webp']
// tope de la imagen ya reducida (guarda: una foto de 2000 px sale en fracciones de MB); es el techo del servidor
export const MAX_BYTES_IMAGEN = 5 * 1024 * 1024

const UMBRAL_SIN_COMPRIMIR = 1.5 * 1024 * 1024
const LADO_MAXIMO = 2000
const CALIDAD = 0.82

export const MENSAJE_IMAGEN_PESADA =
  'Esa imagen pesa demasiado, incluso reducida. Prueba con otra o envíanosla por WhatsApp.'

function dibujar(bitmap: ImageBitmap, ancho: number, alto: number, fondoBlanco: boolean): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = ancho
  canvas.height = alto
  const contexto = canvas.getContext('2d')
  if (!contexto) throw new ErrorImagen(MENSAJE_IMAGEN_ILEGIBLE, 'ilegible')
  // JPEG no tiene transparencia: sin fondo, un PNG transparente saldria negro
  if (fondoBlanco) {
    contexto.fillStyle = 'white'
    contexto.fillRect(0, 0, ancho, alto)
  }
  contexto.drawImage(bitmap, 0, 0, ancho, alto)
  return canvas
}

function aBlob(canvas: HTMLCanvasElement, tipo: string): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, tipo, CALIDAD))
}

/**
 * Decodifica la imagen. Si su lado mayor al mostrarse pasa de 2000 px, pide al navegador que la entregue ya reducida
 * para no pagar el bitmap completo (una foto de 48 MP son ~192 MB).
 * [DECISION] se pasa un solo lado (resizeWidth o resizeHeight) y el navegador calcula el otro: asi no se deforma una foto
 * girada por EXIF si un navegador interpreta el tamano antes o despues de la orientacion. Safari es ambiguo con estas opciones
 * (sin garantia publica): si las rechaza se cae al camino completo, protegido por el tope de 50 MP del inspector.
 */
async function decodificar(archivo: File, info: InspeccionImagen): Promise<ImageBitmap> {
  const girada = info.orientacion >= 5 // 5 a 8 intercambian ancho y alto al mostrarse
  const anchoVisible = girada ? info.alto : info.ancho
  const altoVisible = girada ? info.ancho : info.alto
  // from-image respeta la orientacion EXIF: una foto vertical no llega girada
  const base = { imageOrientation: 'from-image' } as const

  if (Math.max(anchoVisible, altoVisible) > LADO_MAXIMO) {
    const reduccion = anchoVisible >= altoVisible ? { resizeWidth: LADO_MAXIMO } : { resizeHeight: LADO_MAXIMO }
    try {
      return await createImageBitmap(archivo, { ...base, ...reduccion, resizeQuality: 'medium' })
    } catch {
      // el navegador no admite las opciones de reduccion: camino completo
    }
  }
  try {
    return await createImageBitmap(archivo, base)
  } catch {
    throw new ErrorImagen(MENSAJE_IMAGEN_ILEGIBLE, 'ilegible')
  }
}

/**
 * Reduce una imagen para subirla: lado mayor de 2000 px como maximo y WebP (JPEG si el navegador no exporta WebP).
 * Una imagen de 1,5 MB o menos y 2000 px o menos se devuelve tal cual (sin decodificarla); si la version comprimida
 * no es mas liviana se conserva la original. Una imagen liviana pero de muchos pixeles si se reduce.
 * @throws ErrorImagen con `razon`: 'peso' (mas de 25 MB, o mas de 5 MB despues de reducirla), 'heic', 'formato',
 *         'pixeles' (mas de 50 MP declarados) o 'ilegible' (el navegador no puede leerla).
 */
export async function comprimirImagen(archivo: File): Promise<File> {
  const info = await inspeccionarArchivo(archivo)
  if (archivo.size <= UMBRAL_SIN_COMPRIMIR && Math.max(info.ancho, info.alto) <= LADO_MAXIMO) return archivo

  const bitmap = await decodificar(archivo, info)

  const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height))
  const ancho = Math.round(bitmap.width * escala)
  const alto = Math.round(bitmap.height * escala)

  let blob: Blob | null
  try {
    blob = await aBlob(dibujar(bitmap, ancho, alto, false), 'image/webp')
    // un navegador sin WebP en toBlob devuelve PNG: se reintenta en JPEG
    if (!blob || blob.type !== 'image/webp') blob = await aBlob(dibujar(bitmap, ancho, alto, true), 'image/jpeg')
  } finally {
    bitmap.close?.()
  }
  if (!blob) throw new ErrorImagen(MENSAJE_IMAGEN_ILEGIBLE, 'ilegible')

  let resultado = archivo
  if (blob.size < archivo.size) {
    const base = archivo.name.replace(/\.[^.]+$/, '')
    resultado = new File([blob], `${base}${blob.type === 'image/webp' ? '.webp' : '.jpg'}`, { type: blob.type })
  }
  if (resultado.size > MAX_BYTES_IMAGEN) throw new ErrorImagen(MENSAJE_IMAGEN_PESADA, 'peso')
  return resultado
}
