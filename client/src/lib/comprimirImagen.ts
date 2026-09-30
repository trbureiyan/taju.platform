// las fotos de un celular pesan 3 a 8 MB y el limite del servidor es 5 MB: se reducen aqui, en el navegador,
// antes de subirlas. El servidor sigue verificando tipo, firma y peso; esto solo evita rechazos evitables.

export const TIPOS_IMAGEN_ACEPTADOS: readonly string[] = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_BYTES_IMAGEN = 5 * 1024 * 1024

const UMBRAL_SIN_COMPRIMIR = 1.5 * 1024 * 1024
const LADO_MAXIMO = 2000
const CALIDAD = 0.82

export const MENSAJE_FORMATO_IMAGEN =
  'Solo aceptamos imágenes en JPG, PNG o WebP. Si tu referencia está en otro formato, conviértela o envíanosla por WhatsApp.'
export const MENSAJE_IMAGEN_PESADA =
  'Esa imagen pesa demasiado, incluso reducida. Prueba con otra o envíanosla por WhatsApp.'
export const MENSAJE_IMAGEN_ILEGIBLE =
  'No pudimos leer esa imagen. Usa una en JPG, PNG o WebP, o envíanosla por WhatsApp.'

/** Error de una imagen que no se puede usar; su mensaje ya esta escrito para el cliente. */
export class ErrorImagen extends Error {
  constructor(mensaje: string) {
    super(mensaje)
    this.name = 'ErrorImagen'
  }
}

function dibujar(bitmap: ImageBitmap, ancho: number, alto: number, fondoBlanco: boolean): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = ancho
  canvas.height = alto
  const contexto = canvas.getContext('2d')
  if (!contexto) throw new ErrorImagen(MENSAJE_IMAGEN_ILEGIBLE)
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
 * Reduce una imagen para subirla: lado mayor de 2000 px como maximo y WebP (JPEG si el navegador no exporta WebP).
 * Un archivo de 1,5 MB o menos se devuelve tal cual, y si la version comprimida no es mas liviana se conserva la original.
 * @throws ErrorImagen si el navegador no puede leerla o si sigue pesando mas de 5 MB despues de reducirla.
 */
export async function comprimirImagen(archivo: File): Promise<File> {
  if (archivo.size <= UMBRAL_SIN_COMPRIMIR) return archivo

  let bitmap: ImageBitmap
  try {
    // from-image respeta la orientacion EXIF: una foto vertical no llega girada
    bitmap = await createImageBitmap(archivo, { imageOrientation: 'from-image' })
  } catch {
    throw new ErrorImagen(MENSAJE_IMAGEN_ILEGIBLE)
  }

  const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height))
  const ancho = Math.round(bitmap.width * escala)
  const alto = Math.round(bitmap.height * escala)

  let blob = await aBlob(dibujar(bitmap, ancho, alto, false), 'image/webp')
  // un navegador sin WebP en toBlob devuelve PNG: se reintenta en JPEG
  if (!blob || blob.type !== 'image/webp') blob = await aBlob(dibujar(bitmap, ancho, alto, true), 'image/jpeg')
  bitmap.close?.()
  if (!blob) throw new ErrorImagen(MENSAJE_IMAGEN_ILEGIBLE)

  let resultado = archivo
  if (blob.size < archivo.size) {
    const base = archivo.name.replace(/\.[^.]+$/, '')
    resultado = new File([blob], `${base}${blob.type === 'image/webp' ? '.webp' : '.jpg'}`, { type: blob.type })
  }
  if (resultado.size > MAX_BYTES_IMAGEN) throw new ErrorImagen(MENSAJE_IMAGEN_PESADA)
  return resultado
}
