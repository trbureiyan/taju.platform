import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  comprimirImagen,
  ErrorImagen,
  MENSAJE_IMAGEN_ILEGIBLE,
  MENSAJE_IMAGEN_PESADA,
} from './comprimirImagen'

const MB = 1024 * 1024

// JPEG con cabecera real (SOF0 con las medidas pedidas, y EXIF opcional) seguida de relleno hasta `bytes`:
// el inspector lee las medidas de ahi antes de decodificar
function archivoDe(bytes: number, nombre = 'foto.jpg', tipo = 'image/jpeg', ancho = 4000, alto = 3000, orientacion?: number): File {
  const cabecera: number[] = [0xff, 0xd8]
  if (orientacion) {
    cabecera.push(
      ...[0xff, 0xe1, 0x00, 0x22, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00, 0x4d, 0x4d, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x08],
      ...[0x00, 0x01, 0x01, 0x12, 0x00, 0x03, 0x00, 0x00, 0x00, 0x01, 0x00, orientacion, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
    )
  }
  cabecera.push(0xff, 0xc0, 0x00, 0x11, 0x08, alto >> 8, alto & 0xff, ancho >> 8, ancho & 0xff, 0x03, 0, 0, 0, 0, 0, 0, 0, 0, 0)
  const contenido = new Uint8Array(Math.max(bytes, cabecera.length))
  contenido.set(cabecera)
  return new File([contenido], nombre, { type: tipo })
}

// jsdom no trae createImageBitmap ni canvas: se simulan. `resultado` decide que devuelve toBlob por tipo pedido
function simularNavegador(opciones: {
  ancho?: number
  alto?: number
  resultado: (tipo: string) => { bytes: number; tipo: string } | null
}) {
  const { ancho = 4000, alto = 3000, resultado } = opciones
  const dibujados: Array<{ ancho: number; alto: number }> = []
  const crearBitmap = vi.fn<(archivo: File, opciones?: ImageBitmapOptions) => Promise<unknown>>(async () => ({
    width: ancho,
    height: alto,
    close: vi.fn(),
  }))
  vi.stubGlobal('createImageBitmap', crearBitmap)
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    drawImage: vi.fn(),
    fillRect: vi.fn(),
    fillStyle: '',
  } as unknown as CanvasRenderingContext2D)
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (
    this: HTMLCanvasElement,
    callback: BlobCallback,
    tipo?: string,
  ) {
    dibujados.push({ ancho: this.width, alto: this.height })
    const r = resultado(tipo ?? '')
    callback(r ? new Blob([new Uint8Array(r.bytes)], { type: r.tipo }) : null)
  })
  return { dibujados, crearBitmap }
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('comprimirImagen', () => {
  it('una imagen de 1,5 MB o menos y de 2000 px o menos se devuelve tal cual, sin decodificarla', async () => {
    const chica = archivoDe(1.5 * MB, 'foto.jpg', 'image/jpeg', 2000, 1500)
    expect(await comprimirImagen(chica)).toBe(chica)
  })

  it('reduce una imagen liviana pero de 8000 px de lado', async () => {
    const { dibujados } = simularNavegador({ ancho: 8000, alto: 6000, resultado: () => ({ bytes: 200 * 1024, tipo: 'image/webp' }) })
    const liviana = archivoDe(0.5 * MB, 'panoramica.jpg', 'image/jpeg', 8000, 6000)

    const comprimida = await comprimirImagen(liviana)

    expect(dibujados[0]).toEqual({ ancho: 2000, alto: 1500 })
    expect(comprimida).not.toBe(liviana)
    expect(comprimida.size).toBe(200 * 1024)
  })

  it('reduce una foto de celular: lado mayor a 2000 px, WebP, y pesa menos', async () => {
    const { dibujados } = simularNavegador({ resultado: () => ({ bytes: 0.5 * MB, tipo: 'image/webp' }) })
    const grande = archivoDe(6 * MB, 'IMG_0001.jpg')

    const comprimida = await comprimirImagen(grande)

    expect(dibujados[0]).toEqual({ ancho: 2000, alto: 1500 })
    expect(comprimida.type).toBe('image/webp')
    expect(comprimida.name).toBe('IMG_0001.webp')
    expect(comprimida.size).toBe(0.5 * MB)
  })

  it('una foto de celular de 25 MB se reduce a un tamaño que el servidor acepta', async () => {
    const { dibujados } = simularNavegador({ resultado: () => ({ bytes: 0.8 * MB, tipo: 'image/webp' }) })
    const comprimida = await comprimirImagen(archivoDe(25 * MB, 'IMG_0002.jpg'))
    expect(dibujados[0]).toEqual({ ancho: 2000, alto: 1500 })
    expect(comprimida.size).toBeLessThanOrEqual(5 * MB)
  })

  it('pide a createImageBitmap la imagen ya reducida por el lado mayor, para no decodificarla completa', async () => {
    const { crearBitmap } = simularNavegador({ resultado: () => ({ bytes: 0.5 * MB, tipo: 'image/webp' }) })
    const grande = archivoDe(6 * MB)

    await comprimirImagen(grande)

    expect(crearBitmap).toHaveBeenCalledWith(grande, { imageOrientation: 'from-image', resizeWidth: 2000, resizeQuality: 'medium' })
  })

  it('en una foto vertical por EXIF (orientación 6) reduce por el alto, que es su lado mayor al mostrarse', async () => {
    const { crearBitmap } = simularNavegador({ resultado: () => ({ bytes: 0.5 * MB, tipo: 'image/webp' }) })
    const girada = archivoDe(6 * MB, 'vertical.jpg', 'image/jpeg', 4000, 3000, 6)

    await comprimirImagen(girada)

    expect(crearBitmap).toHaveBeenCalledWith(girada, { imageOrientation: 'from-image', resizeHeight: 2000, resizeQuality: 'medium' })
  })

  it('si el navegador rechaza las opciones de reducción, reintenta sin ellas', async () => {
    const { crearBitmap } = simularNavegador({ resultado: () => ({ bytes: 0.5 * MB, tipo: 'image/webp' }) })
    crearBitmap.mockRejectedValueOnce(new Error('opciones no soportadas'))
    const grande = archivoDe(6 * MB)

    const comprimida = await comprimirImagen(grande)

    expect(crearBitmap).toHaveBeenCalledTimes(2)
    expect(crearBitmap).toHaveBeenLastCalledWith(grande, { imageOrientation: 'from-image' })
    expect(comprimida.type).toBe('image/webp')
  })

  it('no agranda una imagen que ya cabe en 2000 px, y no pide reducción', async () => {
    const { dibujados, crearBitmap } = simularNavegador({
      ancho: 1600,
      alto: 1200,
      resultado: () => ({ bytes: 1 * MB, tipo: 'image/webp' }),
    })
    await comprimirImagen(archivoDe(3 * MB, 'foto.jpg', 'image/jpeg', 1600, 1200))
    expect(dibujados[0]).toEqual({ ancho: 1600, alto: 1200 })
    expect(crearBitmap).toHaveBeenCalledWith(expect.anything(), { imageOrientation: 'from-image' })
  })

  it('conserva el original si la version comprimida no es mas liviana', async () => {
    simularNavegador({ resultado: () => ({ bytes: 4 * MB, tipo: 'image/webp' }) })
    const original = archivoDe(3 * MB)
    expect(await comprimirImagen(original)).toBe(original)
  })

  it('si el navegador no exporta WebP, cae a JPEG', async () => {
    simularNavegador({
      resultado: (tipo) => (tipo === 'image/webp' ? { bytes: 9, tipo: 'image/png' } : { bytes: 0.6 * MB, tipo: 'image/jpeg' }),
    })
    const comprimida = await comprimirImagen(archivoDe(5 * MB, 'foto.png', 'image/png'))
    expect(comprimida.type).toBe('image/jpeg')
    expect(comprimida.name).toBe('foto.jpg')
  })

  it('rechaza con un mensaje claro una imagen que sigue por encima de 5 MB tras comprimir', async () => {
    simularNavegador({ resultado: () => ({ bytes: 6 * MB, tipo: 'image/webp' }) })
    await expect(comprimirImagen(archivoDe(8 * MB))).rejects.toMatchObject({
      name: 'ErrorImagen',
      razon: 'peso',
      message: MENSAJE_IMAGEN_PESADA,
    })
  })

  it('rechaza antes de decodificar una imagen que declara más de 50 MP', async () => {
    const { crearBitmap } = simularNavegador({ resultado: () => null })
    await expect(comprimirImagen(archivoDe(1 * MB, 'bomba.jpg', 'image/jpeg', 30000, 30000))).rejects.toMatchObject({ razon: 'pixeles' })
    expect(crearBitmap).not.toHaveBeenCalled()
  })

  it('rechaza antes de decodificar un archivo de más de 25 MB', async () => {
    const { crearBitmap } = simularNavegador({ resultado: () => null })
    await expect(comprimirImagen(archivoDe(25 * MB + 1))).rejects.toMatchObject({ razon: 'peso' })
    expect(crearBitmap).not.toHaveBeenCalled()
  })

  it('rechaza un HEIC aunque se llame .jpg, con razón heic', async () => {
    const heic = new File([Uint8Array.from([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63, ...new Array(20).fill(0)])], 'foto.jpg', {
      type: 'image/jpeg',
    })
    await expect(comprimirImagen(heic)).rejects.toMatchObject({ razon: 'heic' })
  })

  it('rechaza con un mensaje claro un archivo que el navegador no puede leer', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn(async () => { throw new Error('no se pudo decodificar') }))
    const error = await comprimirImagen(archivoDe(4 * MB)).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ErrorImagen)
    expect((error as Error).message).toBe(MENSAJE_IMAGEN_ILEGIBLE)
    expect((error as ErrorImagen).razon).toBe('ilegible')
  })

  it('libera el bitmap aunque falle el dibujo', async () => {
    const close = vi.fn()
    vi.stubGlobal('createImageBitmap', vi.fn(async () => ({ width: 4000, height: 3000, close })))
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    await expect(comprimirImagen(archivoDe(4 * MB))).rejects.toBeInstanceOf(ErrorImagen)
    expect(close).toHaveBeenCalled()
  })
})
