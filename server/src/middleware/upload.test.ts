import { describe, it, expect } from 'vitest'
import express from 'express'
import request from 'supertest'
import { uploadImagen } from './upload.js'

// app minima: si uploadImagen llama next(), devolvemos lo que quedo en req.files para inspeccionarlo
function crearApp() {
  const app = express()
  app.post('/subir', uploadImagen, (req, res) => {
    const archivos = (req.files as Express.Multer.File[]) ?? []
    res.status(200).json({ recibidos: archivos.map((f) => f.originalname) })
  })
  return app
}

// JPEG con cabecera real (FF D8 + SOF0 de 1600 x 1200) seguida de relleno: el servidor lee las dimensiones de ahi
function jpegValido(bytes = 64, ancho = 1600, alto = 1200): Buffer {
  const buf = Buffer.alloc(bytes, 0)
  Buffer.from([0xff, 0xd8]).copy(buf)
  buf.writeUInt16BE(0xffc0, 2)
  buf.writeUInt16BE(17, 4)
  buf[6] = 8
  buf.writeUInt16BE(alto, 7)
  buf.writeUInt16BE(ancho, 9)
  buf[11] = 3
  return buf
}

// PNG con firma (89 50 4E 47 0D 0A 1A 0A) e IHDR reales, seguido de relleno
function pngValido(bytes = 64, ancho = 640, alto = 480): Buffer {
  const buf = Buffer.alloc(bytes, 0)
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buf)
  buf.writeUInt32BE(13, 8)
  buf.write('IHDR', 12, 'ascii')
  buf.writeUInt32BE(ancho, 16)
  buf.writeUInt32BE(alto, 20)
  return buf
}

// WebP extendido (VP8X) real: "RIFF" + tamaño + "WEBP" + lienzo de 800 x 600
function webpValido(bytes = 64): Buffer {
  const buf = Buffer.alloc(bytes, 0)
  buf.write('RIFF', 0, 'ascii')
  buf.write('WEBP', 8, 'ascii')
  buf.write('VP8X', 12, 'ascii')
  buf.writeUInt32LE(10, 16)
  buf.writeUIntLE(799, 24, 3)
  buf.writeUIntLE(599, 27, 3)
  return buf
}

describe('uploadImagen', () => {
  it('deja pasar un JPEG real con mimetype image/jpeg', async () => {
    const res = await request(crearApp())
      .post('/subir')
      .attach('imagenes', jpegValido(), { filename: 'torta.jpg', contentType: 'image/jpeg' })

    expect(res.status).toBe(200)
    expect(res.body.recibidos).toEqual(['torta.jpg'])
  })

  it('rechaza un mimetype que no sea JPG, PNG ni WebP', async () => {
    const res = await request(crearApp())
      .post('/subir')
      .attach('imagenes', Buffer.from('GIF89a'), { filename: 'torta.gif', contentType: 'image/gif' })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Solo se aceptan imágenes JPG, PNG o WebP')
  })

  it('deja pasar un PNG real', async () => {
    const res = await request(crearApp())
      .post('/subir')
      .attach('imagenes', pngValido(), { filename: 'torta.png', contentType: 'image/png' })

    expect(res.status).toBe(200)
    expect(res.body.recibidos).toEqual(['torta.png'])
  })

  it('deja pasar un WebP real', async () => {
    const res = await request(crearApp())
      .post('/subir')
      .attach('imagenes', webpValido(), { filename: 'torta.webp', contentType: 'image/webp' })

    expect(res.status).toBe(200)
    expect(res.body.recibidos).toEqual(['torta.webp'])
  })

  it.each([
    ['PNG', 'image/png', 'torta.png'],
    ['WebP', 'image/webp', 'torta.webp'],
  ])('rechaza un %s falso: declara el tipo pero los bytes no lo son', async (_nombre, contentType, filename) => {
    const res = await request(crearApp())
      .post('/subir')
      .attach('imagenes', Buffer.from('esto no es una imagen'), { filename, contentType })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Uno de los archivos no es una imagen JPG, PNG o WebP válida')
  })

  it('rechaza un archivo que declara PNG pero trae los bytes de un JPEG', async () => {
    const res = await request(crearApp())
      .post('/subir')
      .attach('imagenes', jpegValido(), { filename: 'engano.png', contentType: 'image/png' })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Uno de los archivos no es una imagen JPG, PNG o WebP válida')
  })

  it('rechaza un archivo de más de 5 MB con mensaje amigable', async () => {
    const res = await request(crearApp())
      .post('/subir')
      .attach('imagenes', jpegValido(5 * 1024 * 1024 + 1), {
        filename: 'grande.jpg',
        contentType: 'image/jpeg',
      })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Cada imagen debe pesar menos de 5 MB')
  })

  it('deja pasar un JPEG de 4 MB con cabecera real', async () => {
    const res = await request(crearApp())
      .post('/subir')
      .attach('imagenes', jpegValido(4 * 1024 * 1024), { filename: 'IMG_0001.jpg', contentType: 'image/jpeg' })

    expect(res.status).toBe(200)
  })

  it('rechaza un PNG pequeño que declara 30000 x 30000 píxeles', async () => {
    const res = await request(crearApp())
      .post('/subir')
      .attach('imagenes', pngValido(64, 30000, 30000), { filename: 'bomba.png', contentType: 'image/png' })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Una de tus imágenes tiene demasiados píxeles. Redúcela o envíanosla por WhatsApp.')
  })

  it('rechaza un JPEG con firma real pero cabecera cortada', async () => {
    const res = await request(crearApp())
      .post('/subir')
      .attach('imagenes', Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]), { filename: 'cortada.jpg', contentType: 'image/jpeg' })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('No pudimos leer una de tus imágenes. Prueba con otra en JPG, PNG o WebP.')
  })

  // el mimetype lo declara el cliente; solo los magic bytes prueban que el contenido es JPEG
  it('rechaza un buffer sin firma FF D8 FF aunque declare image/jpeg', async () => {
    const res = await request(crearApp())
      .post('/subir')
      .attach('imagenes', Buffer.from('esto no es una imagen'), {
        filename: 'falso.jpg',
        contentType: 'image/jpeg',
      })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Uno de los archivos no es una imagen JPG, PNG o WebP válida')
  })

  it('rechaza el lote entero si uno solo de los archivos es falso', async () => {
    const res = await request(crearApp())
      .post('/subir')
      .attach('imagenes', jpegValido(), { filename: 'bien.jpg', contentType: 'image/jpeg' })
      .attach('imagenes', Buffer.from('xx'), { filename: 'mal.jpg', contentType: 'image/jpeg' })

    expect(res.status).toBe(400)
  })
})
