import { describe, it, expect } from 'vitest'
import { inspeccionarImagen, ImagenInvalidaError, MAX_LADO, MAX_PIXELES, type MotivoImagen } from './inspeccionarImagen.js'

// cabeceras minimas: solo lo que el lector necesita, sin datos de pixeles
function png(ancho: number, alto: number): Buffer {
  const buf = Buffer.alloc(33)
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buf)
  buf.writeUInt32BE(13, 8)
  buf.write('IHDR', 12, 'ascii')
  buf.writeUInt32BE(ancho, 16)
  buf.writeUInt32BE(alto, 20)
  return buf
}

function jpeg(ancho: number, alto: number, relleno = 0): Buffer {
  const partes: Buffer[] = [Buffer.from([0xff, 0xd8])]
  if (relleno > 0) {
    // APP1 (EXIF) intermedio: el lector debe saltarlo por su longitud
    const app = Buffer.alloc(4 + relleno)
    app.writeUInt16BE(0xffe1, 0)
    app.writeUInt16BE(relleno + 2, 2)
    partes.push(app)
  }
  const sof = Buffer.alloc(19)
  sof.writeUInt16BE(0xffc0, 0)
  sof.writeUInt16BE(17, 2)
  sof[4] = 8
  sof.writeUInt16BE(alto, 5)
  sof.writeUInt16BE(ancho, 7)
  sof[9] = 3
  partes.push(sof, Buffer.from([0xff, 0xd9]))
  return Buffer.concat(partes)
}

function cabeceraWebp(fourCC: string, tamano: number): Buffer {
  const buf = Buffer.alloc(30)
  buf.write('RIFF', 0, 'ascii')
  buf.writeUInt32LE(22, 4)
  buf.write('WEBP', 8, 'ascii')
  buf.write(fourCC, 12, 'ascii')
  buf.writeUInt32LE(tamano, 16)
  return buf
}

function webpLossy(ancho: number, alto: number): Buffer {
  const buf = cabeceraWebp('VP8 ', 10)
  Buffer.from([0x9d, 0x01, 0x2a]).copy(buf, 23)
  buf.writeUInt16LE(ancho & 0x3fff, 26)
  buf.writeUInt16LE(alto & 0x3fff, 28)
  return buf
}

function webpLossless(ancho: number, alto: number): Buffer {
  const buf = cabeceraWebp('VP8L', 5)
  buf[20] = 0x2f
  buf.writeUInt32LE(((ancho - 1) & 0x3fff) | (((alto - 1) & 0x3fff) << 14), 21)
  return buf
}

function webpExtendido(ancho: number, alto: number): Buffer {
  const buf = cabeceraWebp('VP8X', 10)
  buf.writeUIntLE(ancho - 1, 24, 3)
  buf.writeUIntLE(alto - 1, 27, 3)
  return buf
}

function motivoDe(fn: () => unknown): MotivoImagen {
  try {
    fn()
  } catch (err) {
    if (err instanceof ImagenInvalidaError) return err.motivo
    throw err
  }
  throw new Error('no lanzo ImagenInvalidaError')
}

describe('inspeccionarImagen', () => {
  it('lee ancho y alto de un PNG (IHDR)', () => {
    expect(inspeccionarImagen(png(640, 480))).toEqual({ tipo: 'image/png', ancho: 640, alto: 480 })
  })

  it('lee ancho y alto de un JPEG saltando un EXIF de 5 KB hasta el SOF', () => {
    expect(inspeccionarImagen(jpeg(1600, 1200, 5 * 1024))).toEqual({ tipo: 'image/jpeg', ancho: 1600, alto: 1200 })
  })

  it.each([
    ['VP8', webpLossy(800, 600)],
    ['VP8L', webpLossless(800, 600)],
    ['VP8X', webpExtendido(800, 600)],
  ])('lee ancho y alto de un WebP %s', (_nombre, buffer) => {
    expect(inspeccionarImagen(buffer)).toEqual({ tipo: 'image/webp', ancho: 800, alto: 600 })
  })

  it('rechaza un PNG de 30000 x 30000 aunque pese 33 bytes', () => {
    expect(motivoDe(() => inspeccionarImagen(png(30000, 30000)))).toBe('dimensiones')
  })

  it('rechaza un lado mayor a MAX_LADO aunque los pixeles no pasen el tope', () => {
    expect(MAX_LADO).toBe(4096)
    expect(motivoDe(() => inspeccionarImagen(png(MAX_LADO + 1, 100)))).toBe('dimensiones')
  })

  it('acepta justo en el tope de pixeles y de lado', () => {
    expect(MAX_PIXELES).toBe(16_000_000)
    expect(inspeccionarImagen(png(4000, 4000)).ancho).toBe(4000)
  })

  it('rechaza una cabecera truncada como ilegible', () => {
    expect(motivoDe(() => inspeccionarImagen(png(10, 10).subarray(0, 10)))).toBe('ilegible')
    expect(motivoDe(() => inspeccionarImagen(Buffer.from([0xff, 0xd8, 0xff, 0xd9])))).toBe('ilegible')
  })

  it('rechaza dimensiones en cero como ilegibles', () => {
    expect(motivoDe(() => inspeccionarImagen(png(0, 480)))).toBe('ilegible')
  })

  it('rechaza bytes sin firma conocida', () => {
    expect(motivoDe(() => inspeccionarImagen(Buffer.from('esto no es una imagen')))).toBe('firma')
    expect(motivoDe(() => inspeccionarImagen(Buffer.alloc(0)))).toBe('firma')
  })

  it('un segmento JPEG con longitud mayor al buffer no se sale de rango', () => {
    const malo = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe1, 0xff, 0xff]), Buffer.alloc(20)])
    expect(motivoDe(() => inspeccionarImagen(malo))).toBe('ilegible')
  })
})
