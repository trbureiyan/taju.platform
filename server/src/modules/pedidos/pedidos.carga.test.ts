import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import autocannon from 'autocannon'
import { crearApp } from '../../app.js'
import { Pedido } from '../../models/Pedido.js'
import { signToken } from '../../lib/jwt.js'
import { conectarMongoDePrueba, desconectarMongoDePrueba } from '../../test/mongo.js'
import { crearCatalogoYCliente } from '../../test/fixtures.js'

vi.mock('../../lib/cloudinary.js', () => ({
  subirImagen: vi.fn(async () => ({ url: 'https://res.cloudinary.test/taju/pedidos/ref.jpg', publicId: 'taju/pedidos/ref' })),
  eliminarImagen: vi.fn(async () => undefined),
}))

const CONCURRENCIA = 50

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

// criterio de aceptacion del issue #17: 0 duplicados, 0 5xx ni requests sin respuesta, historial completo
describe(`POST /api/pedidos con ${CONCURRENCIA} requests concurrentes del mismo payload`, () => {
  it('crea un solo pedido y responde un estado a cada request', async () => {
    const { categoria, producto, cliente } = await crearCatalogoYCliente()
    const token = signToken({ sub: cliente.id, email: cliente.email, rol: 'cliente' })

    // mismo shape que el crearPedidoSchema del controller: todo string, como llega del form-data
    const payload = {
      productoId: producto.id,
      categoriaId: categoria.id,
      descripcion: 'Topper "Feliz 15 Valentina" para torta de media libra',
      dimensionValor: '22',
      esDimensionPersonalizada: 'false',
      cantidad: '1',
      colores: 'dorado',
      materiales: 'acrílico espejo 3 mm',
      fechaEntrega: '2026-12-12T17:00:00.000Z',
    }

    const estados: number[] = []
    // variante con callback: es la unica cuyo tipo expone la instancia para escuchar cada 'response'
    const resultado = await new Promise<autocannon.Result>((resolve, reject) => {
      const instancia = autocannon(
        {
          url: `${baseUrl}/api/pedidos`,
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
          connections: CONCURRENCIA,
          amount: CONCURRENCIA,
          timeout: 20,
        },
        (err, res) => (err ? reject(err) : resolve(res)),
      )
      instancia.on('response', (_cliente, statusCode) => estados.push(statusCode))
    })

    const pedidos = await Pedido.find({ cliente: cliente._id }).lean()
    const conteo = estados.reduce<Record<number, number>>((acc, s) => ({ ...acc, [s]: (acc[s] ?? 0) + 1 }), {})

    console.log(
      '[carga #17]',
      JSON.stringify({
        requests: resultado.requests.total,
        estados: conteo,
        errores: resultado.errors,
        timeouts: resultado.timeouts,
        '5xx': resultado['5xx'],
        latenciaMs: { p50: resultado.latency.p50, p99: resultado.latency.p99, max: resultado.latency.max },
        pedidosEnColeccion: pedidos.length,
      }),
    )

    // cada request recibio una respuesta con estado, ninguna quedo colgada ni cortada
    expect(estados).toHaveLength(CONCURRENCIA)
    expect(resultado.errors).toBe(0)
    expect(resultado.timeouts).toBe(0)
    expect(resultado['5xx']).toBe(0)

    // uno gana, el resto recibe 409 explicito
    expect(conteo[201]).toBe(1)
    expect(conteo[409]).toBe(CONCURRENCIA - 1)

    expect(pedidos).toHaveLength(1)
    expect(pedidos[0].historialEstados).toHaveLength(1)
    expect(pedidos[0].historialEstados[0]).toMatchObject({ estadoAnterior: null, estadoNuevo: 'recibido' })
    expect(pedidos[0].historialEstados[0].actor.toString()).toBe(cliente.id)
  })
})
