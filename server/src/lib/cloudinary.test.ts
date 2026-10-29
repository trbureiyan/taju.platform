import { describe, it, expect, vi, beforeEach } from 'vitest'

const { subirPorStream, subirPorUri } = vi.hoisted(() => ({ subirPorStream: vi.fn(), subirPorUri: vi.fn() }))

// nunca se llama al Cloudinary real: se intercepta el SDK completo
vi.mock('cloudinary', () => ({
  v2: { config: vi.fn(), uploader: { upload_stream: subirPorStream, upload: subirPorUri, destroy: vi.fn() } },
}))

import { subirImagen, ImagenRechazadaError } from './cloudinary.js'

type Callback = (error: unknown, resultado?: unknown) => void

// simula el stream del SDK: al recibir el buffer responde con lo que el test decida
function responder(error: unknown, resultado?: unknown) {
  const end = vi.fn()
  subirPorStream.mockImplementation((_opciones: unknown, callback: Callback) => ({
    end: (buffer: Buffer) => {
      end(buffer)
      callback(error, resultado)
    },
  }))
  return end
}

const imagen = Buffer.from([0xff, 0xd8, 0xff, 0xe0])

beforeEach(() => {
  subirPorStream.mockReset()
  subirPorUri.mockReset()
})

describe('subirImagen', () => {
  it('sube por stream y no por data URI (evita la copia en base64)', async () => {
    const end = responder(undefined, { secure_url: 'https://res.cloudinary.test/a.jpg', public_id: 'taju/pedidos/a' })

    const resultado = await subirImagen(imagen)

    expect(subirPorUri).not.toHaveBeenCalled()
    expect(end).toHaveBeenCalledWith(imagen)
    expect(resultado).toEqual({ url: 'https://res.cloudinary.test/a.jpg', publicId: 'taju/pedidos/a' })
  })

  it('pide transformación entrante de 2000 px con calidad automática y solo JPG, PNG o WebP', async () => {
    responder(undefined, { secure_url: 'u', public_id: 'p' })

    await subirImagen(imagen)

    expect(subirPorStream.mock.calls[0][0]).toMatchObject({
      folder: 'taju/pedidos',
      resource_type: 'image',
      allowed_formats: ['jpg', 'png', 'webp'],
      transformation: [{ width: 2000, height: 2000, crop: 'limit' }, { quality: 'auto' }],
      timeout: 60_000,
    })
  })

  it('un 400 de Cloudinary se traduce en ImagenRechazadaError con estado 400', async () => {
    responder({ http_code: 400, message: 'Image size too large' })

    const error = await subirImagen(imagen).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ImagenRechazadaError)
    expect((error as ImagenRechazadaError).status).toBe(400)
    expect((error as Error).message).toBe('No pudimos procesar una de tus imágenes. Prueba con otra o escríbenos por WhatsApp.')
  })

  it('un error de red o un 5xx se propaga tal cual', async () => {
    const falla = { http_code: 503, message: 'Service Unavailable' }
    responder(falla)

    await expect(subirImagen(imagen)).rejects.toBe(falla)
  })
})
