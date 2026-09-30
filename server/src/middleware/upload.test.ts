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

// cabecera real de un JPEG (FF D8 FF E0) seguida de relleno
function jpegValido(bytes = 64): Buffer {
  const buf = Buffer.alloc(bytes, 0)
  buf[0] = 0xff
  buf[1] = 0xd8
  buf[2] = 0xff
  buf[3] = 0xe0
  return buf
}

// firma real de un PNG (89 50 4E 47 0D 0A 1A 0A) seguida de relleno
function pngValido(bytes = 64): Buffer {
  const buf = Buffer.alloc(bytes, 0)
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buf)
  return buf
}

// firma real de un WebP: "RIFF" + tamaño de 4 bytes + "WEBP"
function webpValido(bytes = 64): Buffer {
  const buf = Buffer.alloc(bytes, 0)
  buf.write('RIFF', 0, 'ascii')
  buf.write('WEBP', 8, 'ascii')
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
