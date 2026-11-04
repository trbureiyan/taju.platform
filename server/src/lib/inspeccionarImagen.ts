import type { TipoImagen } from '../types/index.js'

export interface DatosImagen {
  tipo: TipoImagen
  ancho: number
  alto: number
}

export type MotivoImagen = 'firma' | 'ilegible' | 'dimensiones'

/** Error de una imagen que no se puede aceptar; `motivo` lo traduce upload.ts a un mensaje para el cliente. */
export class ImagenInvalidaError extends Error {
  constructor(readonly motivo: MotivoImagen) {
    super(`imagen invalida: ${motivo}`)
    this.name = 'ImagenInvalidaError'
  }
}

// 16 MP: sobra para la salida del navegador (lado mayor de 2000 px) y deja holgura bajo los 25 MP del plan gratuito de Cloudinary
export const MAX_PIXELES = 16_000_000
export const MAX_LADO = 4096

const FIRMA_PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

function leerPng(b: Buffer): { ancho: number; alto: number } {
  // IHDR va siempre primero: 8 de firma + 4 de longitud + 4 de nombre + 4 de ancho + 4 de alto
  if (b.length < 24 || b.toString('ascii', 12, 16) !== 'IHDR') throw new ImagenInvalidaError('ilegible')
  return { ancho: b.readUInt32BE(16), alto: b.readUInt32BE(20) }
}

function leerJpeg(b: Buffer): { ancho: number; alto: number } {
  let pos = 2
  while (pos + 4 <= b.length) {
    if (b[pos] !== 0xff) throw new ImagenInvalidaError('ilegible')
    const marcador = b[pos + 1]
    if (marcador === 0xff) {
      pos += 1 // relleno entre segmentos
      continue
    }
    // marcadores sin longitud: pasan al siguiente; EOI y SOS llegan antes de un SOF solo en archivos rotos
    if (marcador === 0xd9 || marcador === 0xda) throw new ImagenInvalidaError('ilegible')
    if (marcador === 0x01 || (marcador >= 0xd0 && marcador <= 0xd8)) {
      pos += 2
      continue
    }
    const longitud = b.readUInt16BE(pos + 2)
    // la longitud incluye sus 2 bytes; un segmento que no cabe en el buffer es un archivo cortado o armado a mano
    if (longitud < 2 || pos + 2 + longitud > b.length) throw new ImagenInvalidaError('ilegible')
    // SOF0 a SOF15 salvo DHT (C4), JPG (C8) y DAC (CC)
    const esSof = marcador >= 0xc0 && marcador <= 0xcf && marcador !== 0xc4 && marcador !== 0xc8 && marcador !== 0xcc
    if (esSof) {
      if (longitud < 8) throw new ImagenInvalidaError('ilegible')
      return { alto: b.readUInt16BE(pos + 5), ancho: b.readUInt16BE(pos + 7) }
    }
    pos += 2 + longitud
  }
  throw new ImagenInvalidaError('ilegible')
}

function leerWebp(b: Buffer): { ancho: number; alto: number } {
  if (b.length < 30) throw new ImagenInvalidaError('ilegible')
  switch (b.toString('ascii', 12, 16)) {
    case 'VP8 ':
      if (b[23] !== 0x9d || b[24] !== 0x01 || b[25] !== 0x2a) throw new ImagenInvalidaError('ilegible')
      return { ancho: b.readUInt16LE(26) & 0x3fff, alto: b.readUInt16LE(28) & 0x3fff }
    case 'VP8L': {
      if (b[20] !== 0x2f) throw new ImagenInvalidaError('ilegible')
      const bits = b.readUInt32LE(21)
      return { ancho: (bits & 0x3fff) + 1, alto: ((bits >>> 14) & 0x3fff) + 1 }
    }
    case 'VP8X':
      return { ancho: b.readUIntLE(24, 3) + 1, alto: b.readUIntLE(27, 3) + 1 }
    default:
      throw new ImagenInvalidaError('ilegible')
  }
}

/**
 * Lee tipo y dimensiones declaradas en la cabecera de una imagen, sin decodificar pixeles.
 * [DECISION] cabeceras a mano y no una libreria - cero dependencias nuevas, y decodificar en el servidor
 * (Render gratuito) es justo el costo de memoria que este chequeo evita. Cloudinary decodifica; aqui solo se topa.
 * @param buffer - Contenido del archivo.
 * @returns Tipo detectado por firma, ancho y alto declarados.
 * @throws ImagenInvalidaError con motivo 'firma' (no es JPG, PNG ni WebP), 'ilegible' (cabecera cortada o incoherente)
 *         o 'dimensiones' (mas de MAX_PIXELES o lado mayor a MAX_LADO).
 */
export function inspeccionarImagen(buffer: Buffer): DatosImagen {
  let tipo: TipoImagen
  let medidas: { ancho: number; alto: number }

  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    tipo = 'image/jpeg'
    medidas = leerJpeg(buffer)
  } else if (buffer.length >= 8 && FIRMA_PNG.every((byte, i) => buffer[i] === byte)) {
    tipo = 'image/png'
    medidas = leerPng(buffer)
  } else if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    tipo = 'image/webp'
    medidas = leerWebp(buffer)
  } else {
    throw new ImagenInvalidaError('firma')
  }

  const { ancho, alto } = medidas
  if (ancho < 1 || alto < 1) throw new ImagenInvalidaError('ilegible')
  if (ancho * alto > MAX_PIXELES || Math.max(ancho, alto) > MAX_LADO) throw new ImagenInvalidaError('dimensiones')
  return { tipo, ancho, alto }
}
