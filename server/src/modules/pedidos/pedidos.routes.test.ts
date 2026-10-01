import { describe, it, expect } from 'vitest'
import express from 'express'
import request from 'supertest'
import { crearPedidosRouter } from './pedidos.routes.js'

// el limiter real se salta en NODE_ENV=test: aqui se arma el router con el limite encendido y bajo para
// comprobar que CADA ruta lo lleva (sin sesion responden 401 hasta agotar el limite, luego 429)
const RUTAS = [
  ['get', '/'],
  ['post', '/'],
  ['get', '/mis-pedidos'],
  ['get', '/abc123'],
  ['patch', '/abc123/estado'],
  ['post', '/abc123/contacto'],
  ['patch', '/abc123/acuerdo'],
  ['patch', '/abc123/cancelar'],
] as const

describe('pedidos | limite de peticiones por ruta', () => {
  it.each(RUTAS)('%s %s responde 429 al superar el limite', async (metodo, ruta) => {
    const app = express()
    app.use(express.json())
    app.use('/pedidos', crearPedidosRouter({ max: 2, skip: () => false }))

    for (let i = 0; i < 2; i += 1) {
      expect((await request(app)[metodo](`/pedidos${ruta === '/' ? '' : ruta}`)).status).toBe(401)
    }
    const res = await request(app)[metodo](`/pedidos${ruta === '/' ? '' : ruta}`)
    expect(res.status).toBe(429)
  })
})
