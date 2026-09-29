import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { crearApp } from '../../app.js'
import { signToken } from '../../lib/jwt.js'
import { conectarMongoDePrueba, desconectarMongoDePrueba, limpiarColecciones } from '../../test/mongo.js'
import { crearCatalogoYCliente } from '../../test/fixtures.js'

// politica de AGENTS.md: ninguna llamada real a Cloudinary en tests
vi.mock('../../lib/cloudinary.js', () => ({
  subirImagen: vi.fn(async () => ({ url: 'https://res.cloudinary.test/taju/pedidos/ref.jpg', publicId: 'taju/pedidos/ref' })),
  eliminarImagen: vi.fn(async () => undefined),
}))

let server: Server
let baseUrl: string

beforeAll(async () => {
  await conectarMongoDePrueba()
  server = crearApp().listen(0)
  await new Promise<void>((resolve) => server.once('listening', resolve))
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()))
  await desconectarMongoDePrueba()
})

afterEach(limpiarColecciones)

async function enviar(cambios: Record<string, string>) {
  const { categoria, producto, cliente } = await crearCatalogoYCliente('papeleria')
  const token = signToken({ sub: cliente.id, email: cliente.email, rol: 'cliente' })
  // mismo shape que llega del form-data: todo string
  const payload = {
    productoId: producto.id,
    categoriaId: categoria.id,
    descripcion: 'Invitaciones para 15 años',
    dimensionValor: '15',
    esDimensionPersonalizada: 'false',
    cantidad: '30',
    colores: 'dorado',
    materiales: 'cartulina',
    fechaDeseada: '2026-12-12T17:00:00.000Z',
    telefono: '3192452842',
    entregaMetodo: 'recoger',
    ...cambios,
  }
  const res = await fetch(`${baseUrl}/api/pedidos`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  })
  return { status: res.status, body: (await res.json()) as { detalles: { fieldErrors: Record<string, string[]> } } }
}

describe('POST /api/pedidos: entrega', () => {
  it('un metodo de entrega desconocido responde 400 con un mensaje que dice que elegir', async () => {
    const { status, body } = await enviar({ entregaMetodo: 'dron' })

    expect(status).toBe(400)
    expect(body.detalles.fieldErrors.entregaMetodo[0]).toMatch(/recoger en el taller o te lo llevamos/)
  })

  it('una direccion de mas de 200 caracteres responde 400 con un mensaje que pide acortarla', async () => {
    const { status, body } = await enviar({ entregaMetodo: 'domicilio', entregaDetalle: 'x'.repeat(201) })

    expect(status).toBe(400)
    expect(body.detalles.fieldErrors.entregaDetalle[0]).toMatch(/200 caracteres/)
  })
})
