// lee el tipo real y las medidas declaradas de una imagen mirando solo sus primeros bytes, sin decodificar nada:
// una foto de 48 MP ocupa ~190 MB al decodificarse y es justo lo que este chequeo evita pagar para luego rechazarla.
// Espeja server/src/lib/inspeccionarImagen.ts (mismos formatos y mismo tope de lectura de cabeceras): cambiar uno sin el otro
// deja al formulario aceptando lo que el servidor rechaza.

export type RazonRechazo = 'formato' | 'heic' | 'peso' | 'pixeles' | 'ilegible' | 'exceso'

/** Una imagen que no se pudo agregar y por que; `nombre` es el del archivo, o un generico cuando el rechazo vino del servidor. */
export interface RechazoImagen {
  nombre: string
  razon: RazonRechazo
}

export interface InspeccionImagen {
  tipo: 'image/jpeg' | 'image/png' | 'image/webp'
  ancho: number
  alto: number
  /** Orientacion EXIF (1 a 8); 1 si no hay. 5 a 8 intercambian ancho y alto al mostrarse. */
  orientacion: number
}

export const MAX_BYTES_ENTRADA = 25 * 1024 * 1024
// 50 MP: deja pasar los 48 MP de un iPhone Pro y rechaza los 200 MP de algunos Android. Una foto de 48 MP decodificada
// completa son ~192 MB; subir este numero sin probar en un iPhone viejo arriesga que la pestana se recargue.
export const MAX_PIXELES_ENTRADA = 50_000_000

// una cabecera JPEG con EXIF y perfil de color rara vez pasa de 100 KB antes del SOF; 256 KB deja margen
const BYTES_CABECERA = 256 * 1024

const MARCAS_HEIF = new Set(['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'hevm', 'hevs', 'mif1', 'msf1', 'heif'])

/** Error de una imagen que no se puede usar; `razon` decide el aviso que ve la persona. */
export class ErrorImagen extends Error {
  constructor(
    mensaje: string,
    readonly razon: RazonRechazo = 'ilegible',
  ) {
    super(mensaje)
    this.name = 'ErrorImagen'
  }
}

export const MENSAJE_FORMATO_IMAGEN =
  'Solo aceptamos imágenes en JPG, PNG o WebP. Si tu referencia está en otro formato, conviértela o envíanosla por WhatsApp.'
export const MENSAJE_IMAGEN_ILEGIBLE = 'No pudimos leer esa imagen. Usa una en JPG, PNG o WebP, o envíanosla por WhatsApp.'

const MENSAJES: Record<RazonRechazo, string> = {
  formato: MENSAJE_FORMATO_IMAGEN,
  heic: 'Esa foto está en formato HEIC, el que usa el iPhone por defecto, y aún no lo leemos. Elige otra en JPG, PNG o WebP o envíanosla por WhatsApp.',
  peso: 'Esa imagen pesa más de 25 MB. Elige una más liviana o envíanosla por WhatsApp.',
  pixeles: 'Esa imagen es enorme y tu celular podría quedarse sin memoria al prepararla. Elige otra o envíanosla por WhatsApp.',
  ilegible: MENSAJE_IMAGEN_ILEGIBLE,
  exceso: 'Caben hasta 3 imágenes. Quita alguna si quieres cambiarla.',
}

function rechazo(razon: RazonRechazo): ErrorImagen {
  return new ErrorImagen(MENSAJES[razon], razon)
}

function ascii(b: Uint8Array, desde: number, hasta: number): string {
  return String.fromCharCode(...b.subarray(desde, hasta))
}

function orientacionExif(b: Uint8Array, inicio: number, fin: number): number {
  const vista = new DataView(b.buffer, b.byteOffset, b.byteLength)
  const tiff = inicio + 6 // despues de "Exif\0\0"
  if (tiff + 8 > fin) return 1
  const little = b[tiff] === 0x49
  if (!little && b[tiff] !== 0x4d) return 1
  const ifd = tiff + vista.getUint32(tiff + 4, little)
  if (ifd + 2 > fin) return 1
  const entradas = vista.getUint16(ifd, little)
  for (let i = 0; i < entradas; i += 1) {
    const entrada = ifd + 2 + i * 12
    if (entrada + 12 > fin) return 1
    if (vista.getUint16(entrada, little) === 0x0112) {
      const valor = vista.getUint16(entrada + 8, little)
      return valor >= 1 && valor <= 8 ? valor : 1
    }
  }
  return 1
}

function leerJpeg(b: Uint8Array): { ancho: number; alto: number; orientacion: number } {
  const vista = new DataView(b.buffer, b.byteOffset, b.byteLength)
  let orientacion = 1
  let pos = 2
  while (pos + 4 <= b.length) {
    if (b[pos] !== 0xff) throw rechazo('ilegible')
    const marcador = b[pos + 1]
    if (marcador === 0xff) {
      pos += 1
      continue
    }
    if (marcador === 0xd9 || marcador === 0xda) throw rechazo('ilegible')
    if (marcador === 0x01 || (marcador >= 0xd0 && marcador <= 0xd8)) {
      pos += 2
      continue
    }
    const longitud = vista.getUint16(pos + 2)
    if (longitud < 2 || pos + 2 + longitud > b.length) throw rechazo('ilegible')
    if (marcador === 0xe1 && ascii(b, pos + 4, pos + 10) === 'Exif\0\0') {
      orientacion = orientacionExif(b, pos + 4, pos + 2 + longitud)
    }
    const esSof = marcador >= 0xc0 && marcador <= 0xcf && marcador !== 0xc4 && marcador !== 0xc8 && marcador !== 0xcc
    if (esSof) {
      if (longitud < 8) throw rechazo('ilegible')
      return { alto: vista.getUint16(pos + 5), ancho: vista.getUint16(pos + 7), orientacion }
    }
    pos += 2 + longitud
  }
  throw rechazo('ilegible')
}

function leerPng(b: Uint8Array): { ancho: number; alto: number; orientacion: number } {
  if (b.length < 24 || ascii(b, 12, 16) !== 'IHDR') throw rechazo('ilegible')
  const vista = new DataView(b.buffer, b.byteOffset, b.byteLength)
  return { ancho: vista.getUint32(16), alto: vista.getUint32(20), orientacion: 1 }
}

function leerWebp(b: Uint8Array): { ancho: number; alto: number; orientacion: number } {
  if (b.length < 30) throw rechazo('ilegible')
  const vista = new DataView(b.buffer, b.byteOffset, b.byteLength)
  switch (ascii(b, 12, 16)) {
    case 'VP8 ':
      if (b[23] !== 0x9d || b[24] !== 0x01 || b[25] !== 0x2a) throw rechazo('ilegible')
      return { ancho: vista.getUint16(26, true) & 0x3fff, alto: vista.getUint16(28, true) & 0x3fff, orientacion: 1 }
    case 'VP8L': {
      if (b[20] !== 0x2f) throw rechazo('ilegible')
      const bits = vista.getUint32(21, true)
      return { ancho: (bits & 0x3fff) + 1, alto: ((bits >>> 14) & 0x3fff) + 1, orientacion: 1 }
    }
    case 'VP8X':
      return {
        ancho: (b[24] | (b[25] << 8) | (b[26] << 16)) + 1,
        alto: (b[27] | (b[28] << 8) | (b[29] << 16)) + 1,
        orientacion: 1,
      }
    default:
      throw rechazo('ilegible')
  }
}

/**
 * Revisa una imagen elegida por la persona antes de decodificarla.
 * [DECISION] el tipo sale de los bytes y no de File.type - iOS entrega a veces tipo vacio o un nombre .jpg sobre un HEIC.
 * @param archivo - Archivo elegido o arrastrado.
 * @returns Tipo real, medidas declaradas y orientacion EXIF.
 * @throws ErrorImagen con razon 'peso' (mas de 25 MB), 'heic', 'formato' (no es JPG, PNG ni WebP), 'ilegible'
 *         (cabecera cortada o incoherente) o 'pixeles' (mas de 50 MP).
 */
export async function inspeccionarArchivo(archivo: File): Promise<InspeccionImagen> {
  if (archivo.size > MAX_BYTES_ENTRADA) throw rechazo('peso')

  const b = new Uint8Array(await archivo.slice(0, BYTES_CABECERA).arrayBuffer())

  let tipo: InspeccionImagen['tipo']
  let medidas: { ancho: number; alto: number; orientacion: number }
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    tipo = 'image/jpeg'
    medidas = leerJpeg(b)
  } else if (b.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, i) => b[i] === byte)) {
    tipo = 'image/png'
    medidas = leerPng(b)
  } else if (b.length >= 12 && ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 12) === 'WEBP') {
    tipo = 'image/webp'
    medidas = leerWebp(b)
  } else if (b.length >= 12 && ascii(b, 4, 8) === 'ftyp' && MARCAS_HEIF.has(ascii(b, 8, 12))) {
    throw rechazo('heic')
  } else {
    throw rechazo('formato')
  }

  const { ancho, alto, orientacion } = medidas
  if (ancho < 1 || alto < 1) throw rechazo('ilegible')
  if (ancho * alto > MAX_PIXELES_ENTRADA) throw rechazo('pixeles')
  return { tipo, ancho, alto, orientacion }
}
