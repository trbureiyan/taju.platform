import { describe, it, expect } from 'vitest'
import { inspeccionarArchivo, ErrorImagen, MAX_BYTES_ENTRADA, MAX_PIXELES_ENTRADA, type RazonRechazo } from './inspeccionarImagen'

// cabeceras minimas: solo lo que el lector necesita, sin datos de pixeles
function png(ancho: number, alto: number): Uint8Array {
  const b = new Uint8Array(33)
  b.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const v = new DataView(b.buffer)
  v.setUint32(8, 13)
  b.set([0x49, 0x48, 0x44, 0x52], 12)
  v.setUint32(16, ancho)
  v.setUint32(20, alto)
  return b
}

function jpeg(ancho: number, alto: number, orientacion?: number): Uint8Array {
  const partes: number[][] = [[0xff, 0xd8]]
  if (orientacion) {
    // APP1 con EXIF big endian y una sola entrada: la orientacion (tag 0x0112)
    partes.push([
      0xff, 0xe1, 0x00, 0x22, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00,
      0x4d, 0x4d, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x08,
      0x00, 0x01, 0x01, 0x12, 0x00, 0x03, 0x00, 0x00, 0x00, 0x01, 0x00, orientacion, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
    ])
  }
  partes.push([0xff, 0xc0, 0x00, 0x11, 0x08, alto >> 8, alto & 0xff, ancho >> 8, ancho & 0xff, 0x03, 0, 0, 0, 0, 0, 0, 0, 0, 0])
  partes.push([0xff, 0xd9])
  return Uint8Array.from(partes.flat())
}

function webp(ancho: number, alto: number): Uint8Array {
  const b = new Uint8Array(30)
  b.set([0x52, 0x49, 0x46, 0x46], 0)
  b.set([0x57, 0x45, 0x42, 0x50], 8)
  b.set([0x56, 0x50, 0x38, 0x58], 12)
  b[24] = (ancho - 1) & 0xff
  b[25] = ((ancho - 1) >> 8) & 0xff
  b[27] = (alto - 1) & 0xff
  b[28] = ((alto - 1) >> 8) & 0xff
  return b
}

// caja ftyp de un contenedor HEIF: 4 bytes de tamaño, "ftyp" y la marca
function heif(marca: string): Uint8Array {
  const b = new Uint8Array(32)
  b[3] = 0x18
  b.set([0x66, 0x74, 0x79, 0x70], 4)
  b.set(Array.from(marca).map((c) => c.charCodeAt(0)), 8)
  return b
}

function archivo(bytes: Uint8Array, nombre = 'foto.jpg', tipo = ''): File {
  return new File([bytes], nombre, { type: tipo })
}

async function razonDe(f: File): Promise<RazonRechazo> {
  try {
    await inspeccionarArchivo(f)
  } catch (err) {
    if (err instanceof ErrorImagen) return err.razon
    throw err
  }
  throw new Error('no lanzo ErrorImagen')
}

describe('inspeccionarArchivo', () => {
  it('detecta JPEG por bytes aunque File.type venga vacío', async () => {
    expect(await inspeccionarArchivo(archivo(jpeg(1600, 1200), 'IMG_0001', ''))).toEqual({
      tipo: 'image/jpeg',
      ancho: 1600,
      alto: 1200,
      orientacion: 1,
    })
  })

  it('lee la orientación EXIF de un JPEG (6 = girada 90 grados)', async () => {
    const r = await inspeccionarArchivo(archivo(jpeg(4000, 3000, 6)))
    expect(r.orientacion).toBe(6)
    expect(r.ancho).toBe(4000)
  })

  it('detecta PNG y WebP y lee sus medidas', async () => {
    expect(await inspeccionarArchivo(archivo(png(640, 480), 'a.png'))).toMatchObject({ tipo: 'image/png', ancho: 640, alto: 480 })
    expect(await inspeccionarArchivo(archivo(webp(800, 600), 'a.webp'))).toMatchObject({ tipo: 'image/webp', ancho: 800, alto: 600 })
  })

  it.each(['heic', 'heix', 'mif1', 'heif'])('detecta HEIC/HEIF por la caja ftyp (%s), también con nombre .jpg', async (marca) => {
    expect(await razonDe(archivo(heif(marca), 'foto.jpg', 'image/jpeg'))).toBe('heic')
  })

  it('rechaza GIF, PDF y texto con razón formato', async () => {
    expect(await razonDe(archivo(new TextEncoder().encode('GIF89a......'), 'a.gif', 'image/gif'))).toBe('formato')
    expect(await razonDe(archivo(new TextEncoder().encode('%PDF-1.7 ...'), 'a.pdf', 'application/pdf'))).toBe('formato')
    expect(await razonDe(archivo(new TextEncoder().encode('hola'), 'a.txt', 'text/plain'))).toBe('formato')
  })

  it('rechaza más de 25 MB con razón peso, sin leer el contenido', async () => {
    const grande = archivo(jpeg(100, 100))
    Object.defineProperty(grande, 'size', { value: MAX_BYTES_ENTRADA + 1 })
    expect(await razonDe(grande)).toBe('peso')
  })

  it('rechaza más de 50 MP declarados con razón pixeles, aunque pese 33 bytes', async () => {
    expect(MAX_PIXELES_ENTRADA).toBe(50_000_000)
    expect(await razonDe(archivo(png(30000, 30000), 'bomba.png', 'image/png'))).toBe('pixeles')
  })

  it('acepta justo en el tope de píxeles (48 MP de un iPhone Pro)', async () => {
    expect((await inspeccionarArchivo(archivo(jpeg(8000, 6000)))).ancho).toBe(8000)
  })

  it('una cabecera truncada o incoherente lanza razón ilegible', async () => {
    expect(await razonDe(archivo(png(10, 10).subarray(0, 10), 'a.png'))).toBe('ilegible')
    expect(await razonDe(archivo(Uint8Array.from([0xff, 0xd8, 0xff, 0xd9])))).toBe('ilegible')
    expect(await razonDe(archivo(png(0, 480), 'a.png'))).toBe('ilegible')
  })
})
