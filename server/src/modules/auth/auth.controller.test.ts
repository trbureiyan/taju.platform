import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import request from 'supertest'
import { crearApp } from '../../app.js'
import { Usuario } from '../../models/Usuario.js'
import { conectarMongoDePrueba, desconectarMongoDePrueba, limpiarColecciones } from '../../test/mongo.js'

beforeAll(conectarMongoDePrueba)
afterAll(desconectarMongoDePrueba)
afterEach(limpiarColecciones)

const valido = { nombre: 'Ana', email: 'ana@taju.co', password: 'clave-segura-123' }

describe('POST /api/auth/registrar | autorización de datos', () => {
  it.each([
    ['ausente', {}],
    ['false', { aceptaDatos: false }],
    ['cadena "true"', { aceptaDatos: 'true' }],
    ['número 1', { aceptaDatos: 1 }],
    ['null', { aceptaDatos: null }],
  ])('responde 400 y no crea la cuenta con aceptaDatos %s', async (_nombre, extra) => {
    const res = await request(crearApp()).post('/api/auth/registrar').send({ ...valido, ...extra })
    expect(res.status).toBe(400)
    expect(await Usuario.countDocuments()).toBe(0)
  })

  it('con aceptaDatos: true crea la cuenta y guarda la autorización, ignorando versión y fecha del cliente', async () => {
    const res = await request(crearApp())
      .post('/api/auth/registrar')
      .send({ ...valido, aceptaDatos: true, autorizacionDatos: { version: 'inventada', aceptadaEn: '2000-01-01' } })
    expect(res.status).toBe(201)
    const guardado = await Usuario.findOne({ email: 'ana@taju.co' }).lean()
    expect(guardado!.autorizacionDatos!.version).not.toBe('inventada')
    expect(guardado!.autorizacionDatos!.aceptadaEn.getFullYear()).toBeGreaterThan(2000)
  })

  it('el usuario devuelto no expone la autorización ni el password', async () => {
    const res = await request(crearApp()).post('/api/auth/registrar').send({ ...valido, aceptaDatos: true })
    expect(res.body.usuario).not.toHaveProperty('password')
    expect(res.body.usuario).not.toHaveProperty('autorizacionDatos')
  })
})
