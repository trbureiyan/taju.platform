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

describe('uploadImagen', () => {
  it('deja pasar un JPEG real con mimetype image/jpeg', async () => {
    const res = await request(crearApp())
      .post('/subir')
      .attach('imagenes', jpegValido(), { filename: 'torta.jpg', contentType: 'image/jpeg' })

    expect(res.status).toBe(200)
    expect(res.body.recibidos).toEqual(['torta.jpg'])
  })

  it('rechaza un mimetype distinto de image/jpeg', async () => {
    const res = await request(crearApp())
      .post('/subir')
      .attach('imagenes', Buffer.from('\x89PNG\r\n'), { filename: 'torta.png', contentType: 'image/png' })

    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/JPG/)
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
    expect(res.body.error).toBe('Uno de los archivos no es una imagen JPG válida')
  })

  it('rechaza el lote entero si uno solo de los archivos es falso', async () => {
    const res = await request(crearApp())
      .post('/subir')
      .attach('imagenes', jpegValido(), { filename: 'bien.jpg', contentType: 'image/jpeg' })
      .attach('imagenes', Buffer.from('xx'), { filename: 'mal.jpg', contentType: 'image/jpeg' })

    expect(res.status).toBe(400)
  })
})
