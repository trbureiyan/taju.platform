import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  comprimirImagen,
  ErrorImagen,
  MENSAJE_IMAGEN_ILEGIBLE,
  MENSAJE_IMAGEN_PESADA,
} from './comprimirImagen'

const MB = 1024 * 1024

function archivoDe(bytes: number, nombre = 'foto.jpg', tipo = 'image/jpeg'): File {
  return new File([new Uint8Array(bytes)], nombre, { type: tipo })
}

// jsdom no trae createImageBitmap ni canvas: se simulan. `resultado` decide que devuelve toBlob por tipo pedido
function simularNavegador(opciones: {
  ancho?: number
  alto?: number
  resultado: (tipo: string) => { bytes: number; tipo: string } | null
}) {
  const { ancho = 4000, alto = 3000, resultado } = opciones
  const dibujados: Array<{ ancho: number; alto: number }> = []
  vi.stubGlobal('createImageBitmap', vi.fn(async () => ({ width: ancho, height: alto, close: vi.fn() })))
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
  return dibujados
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('comprimirImagen', () => {
  it('un archivo de 1,5 MB o menos se devuelve tal cual', async () => {
    const chico = archivoDe(1.5 * MB)
    expect(await comprimirImagen(chico)).toBe(chico)
  })

  it('reduce una foto de celular: lado mayor a 2000 px, WebP, y pesa menos', async () => {
    const dibujados = simularNavegador({ resultado: () => ({ bytes: 0.5 * MB, tipo: 'image/webp' }) })
    const grande = archivoDe(6 * MB, 'IMG_0001.jpg')

    const comprimida = await comprimirImagen(grande)

    expect(dibujados[0]).toEqual({ ancho: 2000, alto: 1500 })
    expect(comprimida.type).toBe('image/webp')
    expect(comprimida.name).toBe('IMG_0001.webp')
    expect(comprimida.size).toBe(0.5 * MB)
  })

  it('no agranda una imagen que ya cabe en 2000 px', async () => {
    const dibujados = simularNavegador({ ancho: 1600, alto: 1200, resultado: () => ({ bytes: 1 * MB, tipo: 'image/webp' }) })
    await comprimirImagen(archivoDe(3 * MB))
    expect(dibujados[0]).toEqual({ ancho: 1600, alto: 1200 })
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
      message: MENSAJE_IMAGEN_PESADA,
    })
  })

  it('rechaza con un mensaje claro un archivo que el navegador no puede leer', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn(async () => { throw new Error('no se pudo decodificar') }))
    const error = await comprimirImagen(archivoDe(4 * MB)).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ErrorImagen)
    expect((error as Error).message).toBe(MENSAJE_IMAGEN_ILEGIBLE)
  })

  it('libera el bitmap aunque falle el dibujo', async () => {
    const close = vi.fn()
    vi.stubGlobal('createImageBitmap', vi.fn(async () => ({ width: 4000, height: 3000, close })))
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    await expect(comprimirImagen(archivoDe(4 * MB))).rejects.toBeInstanceOf(ErrorImagen)
    expect(close).toHaveBeenCalled()
  })
})
