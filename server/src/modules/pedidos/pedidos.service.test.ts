import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import { Types } from 'mongoose'
import { crearPedido, updateEstado } from './pedidos.service.js'
import { Pedido } from '../../models/Pedido.js'
import { AppError } from '../../lib/errors.js'
import { subirImagen, eliminarImagen } from '../../lib/cloudinary.js'
import { ESTADOS_PEDIDO, type EstadoPedido } from '../../types/index.js'
import { conectarMongoDePrueba, desconectarMongoDePrueba, limpiarColecciones } from '../../test/mongo.js'
import { crearCatalogoYCliente, inputPedido } from '../../test/fixtures.js'

// politica de AGENTS.md: ninguna llamada real a Cloudinary en tests
vi.mock('../../lib/cloudinary.js', () => ({
  subirImagen: vi.fn(async () => ({ url: 'https://res.cloudinary.test/taju/pedidos/ref.jpg', publicId: 'taju/pedidos/ref' })),
  eliminarImagen: vi.fn(async () => undefined),
}))

beforeAll(conectarMongoDePrueba)
afterAll(desconectarMongoDePrueba)
afterEach(async () => {
  vi.clearAllMocks()
  await limpiarColecciones()
})

async function pedidoBase() {
  const { categoria, producto, cliente } = await crearCatalogoYCliente()
  const input = inputPedido({
    clienteId: cliente.id,
    productoId: producto.id,
    categoriaId: categoria.id,
  })
  return { input, cliente }
}

// ─── Maquina de estados ───────────────────────────────────────────────────────

describe('updateEstado', () => {
  const admin = new Types.ObjectId().toString()

  async function pedidoEn(estado: EstadoPedido, esDimensionPersonalizada = false) {
    const { input } = await pedidoBase()
    const pedido = await crearPedido({ ...input, esDimensionPersonalizada })
    await Pedido.updateOne({ _id: pedido._id }, { estado })
    return pedido.id as string
  }

  it('recorre los seis estados avanzando de a un paso y deja traza de cada uno', async () => {
    const id = await pedidoEn('recibido')

    for (const estado of ESTADOS_PEDIDO.slice(1)) {
      await updateEstado(id, estado, admin)
    }

    const final = await Pedido.findById(id).lean()
    expect(final!.estado).toBe('entregado')
    // la entrada inicial de crearPedido + una por cada avance
    expect(final!.historialEstados.map((h) => h.estadoNuevo)).toEqual([...ESTADOS_PEDIDO])
    expect(final!.historialEstados.at(-1)!.actor.toString()).toBe(admin)
  })

  it.each([
    ['recibido', 'confirmado'],
    ['recibido', 'entregado'],
    ['confirmado', 'listo_para_entrega'],
  ] as const)('rechaza con 409 el salto %s → %s', async (desde, hacia) => {
    const id = await pedidoEn(desde)
    await expect(updateEstado(id, hacia, admin)).rejects.toMatchObject({ status: 409 })
    expect((await Pedido.findById(id).lean())!.estado).toBe(desde)
  })

  it.each([
    ['en_produccion', 'confirmado'],
    ['en_produccion', 'recibido'],
    ['entregado', 'listo_para_entrega'],
  ] as const)('rechaza con 409 el retroceso %s → %s', async (desde, hacia) => {
    const id = await pedidoEn(desde)
    await expect(updateEstado(id, hacia, admin)).rejects.toMatchObject({ status: 409 })
  })

  it('rechaza con 409 quedarse en el mismo estado', async () => {
    const id = await pedidoEn('en_revision')
    await expect(updateEstado(id, 'en_revision', admin)).rejects.toBeInstanceOf(AppError)
  })

  it('responde 404 si el pedido no existe', async () => {
    const inexistente = new Types.ObjectId().toString()
    await expect(updateEstado(inexistente, 'en_revision', admin)).rejects.toMatchObject({ status: 404 })
  })

  describe('con dimension personalizada', () => {
    it('bloquea el paso a en_produccion sin confirmacion explicita', async () => {
      const id = await pedidoEn('confirmado', true)

      await expect(updateEstado(id, 'en_produccion', admin)).rejects.toMatchObject({ status: 409 })

      const pedido = await Pedido.findById(id).lean()
      expect(pedido!.estado).toBe('confirmado')
      expect(pedido!.confirmacionDimensionPersonalizada).toBe(false)
    })

    it('avanza y persiste la confirmacion cuando el admin la manda', async () => {
      const id = await pedidoEn('confirmado', true)

      await updateEstado(id, 'en_produccion', admin, true)

      const pedido = await Pedido.findById(id).lean()
      expect(pedido!.estado).toBe('en_produccion')
      expect(pedido!.confirmacionDimensionPersonalizada).toBe(true)
    })

    it('no exige confirmacion en transiciones distintas a en_produccion', async () => {
      const id = await pedidoEn('recibido', true)
      await expect(updateEstado(id, 'en_revision', admin)).resolves.toBeTruthy()
    })
  })

  it('una dimension estandar pasa a en_produccion sin confirmacion', async () => {
    const id = await pedidoEn('confirmado', false)
    await updateEstado(id, 'en_produccion', admin)
    expect((await Pedido.findById(id).lean())!.estado).toBe('en_produccion')
  })
})

// ─── Creacion: idempotencia y transaccion (issue #17) ────────────────────────

describe('crearPedido', () => {
  it('crea el pedido en recibido con su primera entrada de historial', async () => {
    const { input, cliente } = await pedidoBase()

    const pedido = await crearPedido(input)

    expect(pedido.estado).toBe('recibido')
    expect(pedido.historialEstados).toHaveLength(1)
    expect(pedido.historialEstados[0]).toMatchObject({ estadoAnterior: null, estadoNuevo: 'recibido' })
    expect(pedido.historialEstados[0].actor.toString()).toBe(cliente.id)
  })

  it('sube las referencias por el modulo de Cloudinary (mockeado)', async () => {
    const { input } = await pedidoBase()
    const archivo = { originalname: 'ref.jpg', size: 10, buffer: Buffer.from([0xff, 0xd8, 0xff]), mimetype: 'image/jpeg' }

    const pedido = await crearPedido({ ...input, archivos: [archivo as Express.Multer.File] })

    expect(subirImagen).toHaveBeenCalledOnce()
    expect(pedido.imagenesReferencia[0].url).toMatch(/^https:\/\/res\.cloudinary\.test\//)
  })

  it('rechaza con 409 el mismo pedido repetido dentro de la ventana', async () => {
    const { input } = await pedidoBase()

    await crearPedido(input)
    await expect(crearPedido(input)).rejects.toMatchObject({ status: 409 })

    expect(await Pedido.countDocuments()).toBe(1)
  })

  // el doble click no deberia gastar subidas a Cloudinary en un pedido que igual se va a rechazar
  it('no sube imagenes cuando el duplicado ya esta registrado', async () => {
    const { input } = await pedidoBase()
    const archivo = { originalname: 'ref.jpg', size: 10, buffer: Buffer.from([0xff, 0xd8, 0xff]), mimetype: 'image/jpeg' }
    const conArchivo = { ...input, archivos: [archivo as Express.Multer.File] }

    await crearPedido(conArchivo)
    vi.mocked(subirImagen).mockClear()
    await expect(crearPedido(conArchivo)).rejects.toMatchObject({ status: 409 })

    expect(subirImagen).not.toHaveBeenCalled()
  })

  // el perdedor de una carrera simultanea ya subio su imagen antes de perder - no debe quedar huerfana
  it('limpia en Cloudinary las imagenes del perdedor de una carrera con archivos', async () => {
    const { input } = await pedidoBase()
    const archivo = { originalname: 'ref.jpg', size: 10, buffer: Buffer.from([0xff, 0xd8, 0xff]), mimetype: 'image/jpeg' }
    const conArchivo = { ...input, archivos: [archivo as Express.Multer.File] }

    const resultados = await Promise.allSettled([crearPedido(conArchivo), crearPedido(conArchivo)])

    const rechazos = resultados.filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    expect(rechazos).toHaveLength(1)
    expect(eliminarImagen).toHaveBeenCalledOnce()
    expect(eliminarImagen).toHaveBeenCalledWith('taju/pedidos/ref')
  })

  it('50 envios concurrentes del mismo pedido dejan exactamente uno', async () => {
    const { input } = await pedidoBase()

    const resultados = await Promise.allSettled(Array.from({ length: 50 }, () => crearPedido(input)))

    const creados = resultados.filter((r) => r.status === 'fulfilled')
    const rechazos = resultados.filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    expect(creados).toHaveLength(1)
    expect(rechazos.every((r) => r.reason instanceof AppError && r.reason.status === 409)).toBe(true)
    expect(await Pedido.countDocuments()).toBe(1)
  })

  it('pedidos distintos del mismo cliente no se bloquean entre si', async () => {
    const { input } = await pedidoBase()

    await crearPedido(input)
    await crearPedido({ ...input, cantidad: 2 })
    await crearPedido({ ...input, fechaEntrega: new Date('2026-12-19T17:00:00.000Z') })

    expect(await Pedido.countDocuments()).toBe(3)
  })

  it('el mismo pedido se acepta de nuevo cuando la ventana ya paso', async () => {
    const { input } = await pedidoBase()
    // solo Date: los timers reales siguen corriendo para que el driver de Mongo no se congele
    vi.useFakeTimers({ toFake: ['Date'] })
    try {
      await crearPedido(input)
      vi.setSystemTime(Date.now() + 61_000)
      await expect(crearPedido(input)).resolves.toBeTruthy()
    } finally {
      vi.useRealTimers()
    }

    expect(await Pedido.countDocuments()).toBe(2)
  })

  it('si falla la creacion del pedido, la clave no queda tomada', async () => {
    const { input } = await pedidoBase()
    const falla = vi.spyOn(Pedido, 'create').mockRejectedValueOnce(new Error('mongo caido a mitad'))

    await expect(crearPedido(input)).rejects.toThrow('mongo caido a mitad')
    falla.mockRestore()

    // la transaccion revirtio la reserva de la clave: el reintento legitimo entra
    await expect(crearPedido(input)).resolves.toBeTruthy()
    expect(await Pedido.countDocuments()).toBe(1)
  })
})
