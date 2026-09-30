import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest'
import mongoose, { Types } from 'mongoose'
import {
  crearPedido,
  updateEstado,
  marcarContactado,
  registrarAcuerdo,
  cancelarMiPedido,
  getMisPedidos,
  getPedidoById,
  getAllPedidos,
} from './pedidos.service.js'
import { Pedido } from '../../models/Pedido.js'
import { Usuario } from '../../models/Usuario.js'
import { AppError } from '../../lib/errors.js'
import { subirImagen, eliminarImagen } from '../../lib/cloudinary.js'
import { FLUJO_PEDIDO, type EstadoPedido } from '../../types/index.js'
import { conectarMongoDePrueba, desconectarMongoDePrueba, limpiarColecciones } from '../../test/mongo.js'
import { crearCatalogoYCliente, fechaFutura, inputPedido } from '../../test/fixtures.js'

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
  const { categoria, producto, cliente } = await crearCatalogoYCliente('papeleria')
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

  // confirmado exige contacto, fecha acordada y entrega; en_produccion exige anticipo. Los tests que ya parten
  // de esos estados escriben el acuerdo directo en la base para no repetir el camino completo
  async function conAcuerdo(id: string) {
    await Pedido.updateOne(
      { _id: id },
      {
        contactadoEn: new Date(),
        fechaEntrega: new Date('2026-12-12T17:00:00.000Z'),
        pago: { monto: 50000, medio: 'nequi', registradoEn: new Date() },
      },
    )
  }

  it('recorre los seis estados avanzando de a un paso y deja traza de cada uno', async () => {
    const id = await pedidoEn('recibido')

    await marcarContactado(id, admin) // recibido -> en_revision en un solo gesto
    await registrarAcuerdo(id, {
      fechaEntrega: new Date('2026-12-12T17:00:00.000Z'),
      pago: { monto: 50000, medio: 'nequi' },
    })
    for (const estado of FLUJO_PEDIDO.slice(2)) {
      await updateEstado(id, estado, admin)
    }

    const final = await Pedido.findById(id).lean()
    expect(final!.estado).toBe('entregado')
    // la entrada inicial de crearPedido + una por cada avance
    expect(final!.historialEstados.map((h) => h.estadoNuevo)).toEqual([...FLUJO_PEDIDO])
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

  describe('cancelacion', () => {
    it.each(['recibido', 'en_revision', 'confirmado'] as const)(
      'permite cancelar desde %s y deja traza',
      async (desde) => {
        const id = await pedidoEn(desde)

        await updateEstado(id, 'cancelado', admin)

        const pedido = await Pedido.findById(id).lean()
        expect(pedido!.estado).toBe('cancelado')
        expect(pedido!.historialEstados.at(-1)).toMatchObject({ estadoAnterior: desde, estadoNuevo: 'cancelado' })
      },
    )

    it.each(['en_produccion', 'listo_para_entrega', 'entregado', 'cancelado'] as const)(
      'rechaza con 409 cancelar desde %s',
      async (desde) => {
        const id = await pedidoEn(desde)
        await expect(updateEstado(id, 'cancelado', admin)).rejects.toMatchObject({ status: 409 })
        expect((await Pedido.findById(id).lean())!.estado).toBe(desde)
      },
    )

    it.each(FLUJO_PEDIDO)('un pedido cancelado no vuelve a %s', async (hacia) => {
      const id = await pedidoEn('cancelado')
      await expect(updateEstado(id, hacia, admin)).rejects.toMatchObject({ status: 409 })
    })
  })

  it('responde 404 si el pedido no existe', async () => {
    const inexistente = new Types.ObjectId().toString()
    await expect(updateEstado(inexistente, 'en_revision', admin)).rejects.toMatchObject({ status: 404 })
  })

  describe('con dimension personalizada', () => {
    it('bloquea el paso a en_produccion sin confirmacion explicita', async () => {
      const id = await pedidoEn('confirmado', true)
      await conAcuerdo(id)

      await expect(updateEstado(id, 'en_produccion', admin)).rejects.toMatchObject({ status: 409 })

      const pedido = await Pedido.findById(id).lean()
      expect(pedido!.estado).toBe('confirmado')
      expect(pedido!.confirmacionDimensionPersonalizada).toBe(false)
    })

    it('avanza y persiste la confirmacion cuando el admin la manda', async () => {
      const id = await pedidoEn('confirmado', true)
      await conAcuerdo(id)

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
    await conAcuerdo(id)
    await updateEstado(id, 'en_produccion', admin)
    expect((await Pedido.findById(id).lean())!.estado).toBe('en_produccion')
  })
})

// ─── Creacion: idempotencia y transaccion (issue #17) ────────────────────────

describe('crearPedido', () => {
  it('rechaza con 400 un topper sin imagen de referencia y no sube nada', async () => {
    const { categoria, producto, cliente } = await crearCatalogoYCliente('toppers')
    const input = inputPedido({ clienteId: cliente.id, productoId: producto.id, categoriaId: categoria.id })

    await expect(crearPedido(input)).rejects.toMatchObject({ status: 400 })

    expect(subirImagen).not.toHaveBeenCalled()
    expect(await Pedido.countDocuments()).toBe(0)
  })

  it('rechaza con 400 una solicitud sin fecha deseada', async () => {
    const { input } = await pedidoBase()
    await expect(crearPedido({ ...input, fechaDeseada: null })).rejects.toMatchObject({ status: 400 })
    expect(await Pedido.countDocuments()).toBe(0)
  })

  it('crea el pedido en recibido con su primera entrada de historial', async () => {
    const { input, cliente } = await pedidoBase()

    const pedido = await crearPedido(input)

    expect(pedido.estado).toBe('recibido')
    expect(pedido.historialEstados).toHaveLength(1)
    expect(pedido.historialEstados[0]).toMatchObject({ estadoAnterior: null, estadoNuevo: 'recibido' })
    expect(pedido.historialEstados[0].actor.toString()).toBe(cliente.id)
  })

  it('guarda el contacto como snapshot, la fecha deseada y deja vacio lo que decide el taller', async () => {
    const { input } = await pedidoBase()

    const creado = await crearPedido({ ...input, entregaMetodo: 'domicilio', entregaDetalle: '  Cra 5 # 10-20  ' })

    const pedido = await Pedido.findById(creado._id).lean()
    expect(pedido!.contacto).toEqual({ nombre: 'Laura', telefono: '3192452842' })
    expect(pedido!.entrega).toEqual({ metodo: 'domicilio', detalle: 'Cra 5 # 10-20' })
    expect(pedido!.fechaDeseada!.toISOString()).toBe(input.fechaDeseada!.toISOString())
    expect(pedido!.fechaEntrega).toBeNull()
    expect(pedido!.pago).toBeNull()
    expect(pedido!.contactadoEn).toBeNull()
  })

  it('cambiar el celular o la entrega hace otra solicitud para la clave de idempotencia', async () => {
    const { input } = await pedidoBase()

    await crearPedido(input)
    await crearPedido({ ...input, telefono: '3001234567' })
    await crearPedido({ ...input, entregaMetodo: 'domicilio', entregaDetalle: 'Cra 5 # 10-20' })

    expect(await Pedido.countDocuments()).toBe(3)
  })

  it('rechaza con 401 si la cuenta del cliente ya no existe', async () => {
    const { input } = await pedidoBase()
    await expect(crearPedido({ ...input, clienteId: new Types.ObjectId().toString() })).rejects.toMatchObject({
      status: 401,
    })
    expect(await Pedido.countDocuments()).toBe(0)
  })

  it('sube las referencias por el modulo de Cloudinary (mockeado)', async () => {
    const { input } = await pedidoBase()
    const archivo = { originalname: 'ref.jpg', size: 10, buffer: Buffer.from([0xff, 0xd8, 0xff]), mimetype: 'image/jpeg' }

    const pedido = await crearPedido({ ...input, archivos: [archivo as Express.Multer.File] })

    expect(subirImagen).toHaveBeenCalledOnce()
    expect(pedido.imagenesReferencia[0].url).toMatch(/^https:\/\/res\.cloudinary\.test\//)
  })

  it('guarda el tipo real de cada referencia: PNG y WebP no se anotan como JPEG', async () => {
    const { input } = await pedidoBase()
    const png = { originalname: 'ref.png', size: 10, buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]), mimetype: 'image/png' }
    const webp = { originalname: 'ref.webp', size: 10, buffer: Buffer.from('RIFFxxxxWEBP'), mimetype: 'image/webp' }

    const pedido = await crearPedido({ ...input, archivos: [png, webp] as Express.Multer.File[] })

    expect(pedido.imagenesReferencia.map((i) => i.mimeType)).toEqual(['image/png', 'image/webp'])
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

  // hallazgo de la revision de seguridad en PR #65: con Promise.all, una subida que si termino entre
  // varias en paralelo quedaba sin ninguna referencia (la asignacion completa nunca sucedia) y jamas se limpiaba
  it('si una subida falla y otra tuvo exito, limpia la que si subio y propaga el error', async () => {
    const { input } = await pedidoBase()
    const archivo1 = { originalname: 'a.jpg', size: 10, buffer: Buffer.from([0xff, 0xd8, 0xff]), mimetype: 'image/jpeg' }
    const archivo2 = { originalname: 'b.jpg', size: 10, buffer: Buffer.from([0xff, 0xd8, 0xff]), mimetype: 'image/jpeg' }

    vi.mocked(subirImagen)
      .mockResolvedValueOnce({ url: 'https://res.cloudinary.test/a.jpg', publicId: 'taju/pedidos/a' })
      .mockRejectedValueOnce(new Error('cloudinary caido'))

    await expect(
      crearPedido({ ...input, archivos: [archivo1, archivo2] as Express.Multer.File[] }),
    ).rejects.toThrow('cloudinary caido')

    expect(eliminarImagen).toHaveBeenCalledOnce()
    expect(eliminarImagen).toHaveBeenCalledWith('taju/pedidos/a')
    expect(await Pedido.countDocuments()).toBe(0)
  })

  // hallazgo de la revision de seguridad en PR #65: withTransaction puede lanzar por un commit ambiguo
  // (UnknownTransactionCommitResult) aunque el pedido haya quedado creado de verdad - no hay que borrar
  // sus imagenes como si hubiera fallado
  it('si el commit es ambiguo pero el pedido ya se creo, lo devuelve sin borrar sus imagenes', async () => {
    const { input } = await pedidoBase()
    const archivo = { originalname: 'ref.jpg', size: 10, buffer: Buffer.from([0xff, 0xd8, 0xff]), mimetype: 'image/jpeg' }

    const sesionReal = await mongoose.startSession()
    const withTransactionOriginal = sesionReal.withTransaction.bind(sesionReal)
    vi.spyOn(sesionReal, 'withTransaction').mockImplementationOnce(async (fn) => {
      await withTransactionOriginal(fn)
      throw new Error('UnknownTransactionCommitResult simulado')
    })
    vi.spyOn(mongoose, 'startSession').mockResolvedValueOnce(sesionReal)

    const pedido = await crearPedido({ ...input, archivos: [archivo as Express.Multer.File] })

    expect(pedido).toBeTruthy()
    expect(eliminarImagen).not.toHaveBeenCalled()
    expect(await Pedido.countDocuments()).toBe(1)
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
    await crearPedido({ ...input, fechaDeseada: fechaFutura(37) })

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

  // hallazgo de CodeRabbit en PR #65: antes solo se limpiaba en el catch de clave duplicada,
  // cualquier otra falla de la transaccion dejaba las imagenes huerfanas para siempre
  it('limpia las imagenes aunque la transaccion falle por una razon distinta a clave duplicada', async () => {
    const { input } = await pedidoBase()
    const archivo = { originalname: 'ref.jpg', size: 10, buffer: Buffer.from([0xff, 0xd8, 0xff]), mimetype: 'image/jpeg' }
    const falla = vi.spyOn(Pedido, 'create').mockRejectedValueOnce(new Error('mongo caido a mitad'))

    await expect(crearPedido({ ...input, archivos: [archivo as Express.Multer.File] })).rejects.toThrow(
      'mongo caido a mitad',
    )

    falla.mockRestore()
    expect(eliminarImagen).toHaveBeenCalledWith('taju/pedidos/ref')
  })

  describe('minimo de la familia y fecha', () => {
    async function superficies(cantidad: number) {
      const { categoria, producto, cliente } = await crearCatalogoYCliente('superficies', {
        unitario: null,
        escalas: [{ cantidadMinima: 12, precioUnitario: 9000 }],
      })
      const input = inputPedido({ clienteId: cliente.id, productoId: producto.id, categoriaId: categoria.id })
      return { ...input, cantidad }
    }

    it('rechaza 5 unidades de superficies: el minimo sale de la escala del producto', async () => {
      await expect(crearPedido(await superficies(5))).rejects.toThrow(/desde 12 unidades/)
      expect(await Pedido.countDocuments()).toBe(0)
    })

    it('acepta 12 unidades de superficies', async () => {
      const pedido = await crearPedido(await superficies(12))
      expect(pedido.cantidad).toBe(12)
    })

    it('un producto sin escalas se pide desde 1 unidad', async () => {
      const { input } = await pedidoBase()
      const pedido = await crearPedido({ ...input, cantidad: 1 })
      expect(pedido.cantidad).toBe(1)
    })

    it('rechaza una fecha deseada en el pasado, sin subir imagenes', async () => {
      const { input } = await pedidoBase()
      await expect(crearPedido({ ...input, fechaDeseada: new Date('2020-01-01T15:00:00.000Z') })).rejects.toThrow(
        /ya pasó/,
      )
      expect(subirImagen).not.toHaveBeenCalled()
    })

    it('acepta un domingo: el servidor no rechaza dias sin servicio', async () => {
      const { input } = await pedidoBase()
      // domingo 6 de enero de 2030
      const pedido = await crearPedido({ ...input, fechaDeseada: new Date('2030-01-06T15:00:00.000Z') })
      expect(pedido.fechaDeseada!.toISOString()).toBe('2030-01-06T15:00:00.000Z')
    })
  })
})

// ─── Consultas del cliente ──────────────────────────────────────────────────

describe('getMisPedidos y getPedidoById', () => {
  it('devuelven el historial de estados sin el actor', async () => {
    const { input, cliente } = await pedidoBase()
    const pedido = await crearPedido(input)

    const lista = await getMisPedidos(cliente.id as string)
    expect(lista).toHaveLength(1)
    expect(lista[0].historialEstados[0]).toEqual({
      estadoAnterior: null,
      estadoNuevo: 'recibido',
      fecha: expect.any(Date),
    })
    expect(lista[0].historialEstados[0]).not.toHaveProperty('actor')

    const detalle = await getPedidoById(pedido.id as string, cliente.id as string)
    expect(detalle.historialEstados[0]).not.toHaveProperty('actor')
  })

  it('getPedidoById responde 404 cuando el pedido es de otro cliente', async () => {
    const { input } = await pedidoBase()
    const pedido = await crearPedido(input)
    const otroCliente = new Types.ObjectId().toString()

    await expect(getPedidoById(pedido.id as string, otroCliente)).rejects.toThrow(AppError)
  })
})

// ─── Panel de taller (admin) ────────────────────────────────────────────────

describe('getAllPedidos — paginación', () => {
  async function crearPedidosDistintos(n: number) {
    const { input } = await pedidoBase()
    for (let i = 0; i < n; i++) {
      // variar cantidad para obtener claves de idempotencia distintas
      await crearPedido({ ...input, cantidad: i + 1 })
    }
  }

  it('devuelve como máximo N pedidos por página', async () => {
    await crearPedidosDistintos(3)
    const pagina1 = await getAllPedidos(2, 1)
    expect(pagina1.length).toBeLessThanOrEqual(2)
  })

  it('pagina 2 no contiene los mismos pedidos que pagina 1', async () => {
    await crearPedidosDistintos(3)
    const p1 = await getAllPedidos(2, 1)
    const p2 = await getAllPedidos(2, 2)
    expect(p1).toHaveLength(2)
    expect(p2).toHaveLength(1)
    const idsP1 = new Set(p1.map((p) => (p._id as { toString(): string }).toString()))
    expect(p2.every((p) => !idsP1.has((p._id as { toString(): string }).toString()))).toBe(true)
  })

  it('sin parámetros retorna hasta 50 pedidos por defecto', async () => {
    await crearPedidosDistintos(3)
    const todos = await getAllPedidos()
    expect(todos.length).toBeLessThanOrEqual(50)
  })
})

// ─── Compuertas, contacto, acuerdo y cancelacion del cliente ─────────────────

describe('compuertas de updateEstado', () => {
  const admin = new Types.ObjectId().toString()

  async function solicitudEn(estado: EstadoPedido, extra: Record<string, unknown> = {}) {
    const { input } = await pedidoBase()
    const pedido = await crearPedido({ ...input, ...extra })
    await Pedido.updateOne({ _id: pedido._id }, { estado })
    return pedido.id as string
  }

  async function errorDe(promesa: Promise<unknown>) {
    return promesa.then(
      () => null,
      (e: unknown) => e as AppError,
    )
  }

  it('no confirma sin contacto ni fecha acordada y nombra lo que falta', async () => {
    const id = await solicitudEn('en_revision')

    const error = await errorDe(updateEstado(id, 'confirmado', admin))

    expect(error).toBeInstanceOf(AppError)
    expect(error!.status).toBe(409)
    expect(error!.message).toMatch(/marcar que ya hablaste con el cliente/)
    expect(error!.message).toMatch(/la fecha de entrega acordada/)
  })

  it('un domicilio sin direccion no se confirma', async () => {
    const id = await solicitudEn('en_revision', { entregaMetodo: 'domicilio', entregaDetalle: '' })
    await registrarAcuerdo(id, { fechaEntrega: new Date('2026-12-12T17:00:00.000Z') })
    await Pedido.updateOne({ _id: id }, { contactadoEn: new Date() })

    const error = await errorDe(updateEstado(id, 'confirmado', admin))

    expect(error!.status).toBe(409)
    expect(error!.message).toMatch(/la dirección de entrega/)
  })

  it('confirma cuando hay contacto, fecha acordada y entrega', async () => {
    const id = await solicitudEn('en_revision')
    await marcarContactado(id, admin)
    await registrarAcuerdo(id, { fechaEntrega: new Date('2026-12-12T17:00:00.000Z') })

    await updateEstado(id, 'confirmado', admin)

    expect((await Pedido.findById(id).lean())!.estado).toBe('confirmado')
  })

  it('la fecha de entrega acordada no se valida contra el calendario: un domingo confirma', async () => {
    const id = await solicitudEn('en_revision')
    await Pedido.updateOne({ _id: id }, { contactadoEn: new Date() })
    await registrarAcuerdo(id, { fechaEntrega: new Date('2030-01-06T15:00:00.000Z') })
    const confirmado = await updateEstado(id, 'confirmado', admin)
    expect(confirmado!.estado).toBe('confirmado')
  })

  it('no pasa a produccion sin anticipo registrado', async () => {
    const id = await solicitudEn('confirmado')

    const error = await errorDe(updateEstado(id, 'en_produccion', admin))

    expect(error!.status).toBe(409)
    expect(error!.message).toMatch(/el anticipo/)
    expect((await Pedido.findById(id).lean())!.estado).toBe('confirmado')
  })

  it('cancelar no exige nada registrado', async () => {
    const id = await solicitudEn('en_revision')
    await expect(updateEstado(id, 'cancelado', admin)).resolves.toBeTruthy()
  })
})

describe('marcarContactado', () => {
  const admin = new Types.ObjectId().toString()

  async function recien() {
    const { input } = await pedidoBase()
    return (await crearPedido(input)).id as string
  }

  it('desde recibido marca el contacto y pasa a en_revision en un solo gesto', async () => {
    const id = await recien()

    await marcarContactado(id, admin)

    const pedido = await Pedido.findById(id).lean()
    expect(pedido!.contactadoEn).toBeInstanceOf(Date)
    expect(pedido!.estado).toBe('en_revision')
    expect(pedido!.historialEstados.at(-1)).toMatchObject({ estadoAnterior: 'recibido', estadoNuevo: 'en_revision' })
    expect(pedido!.historialEstados.at(-1)!.actor.toString()).toBe(admin)
  })

  it('es idempotente: escribirle dos veces no mueve la marca ni el historial', async () => {
    const id = await recien()

    await marcarContactado(id, admin)
    const primera = (await Pedido.findById(id).lean())!
    await marcarContactado(id, admin)
    const segunda = (await Pedido.findById(id).lean())!

    expect(segunda.contactadoEn!.getTime()).toBe(primera.contactadoEn!.getTime())
    expect(segunda.historialEstados).toHaveLength(primera.historialEstados.length)
  })

  it.each(['entregado', 'cancelado'] as const)('rechaza con 409 un pedido %s', async (estado) => {
    const id = await recien()
    await Pedido.updateOne({ _id: id }, { estado })
    await expect(marcarContactado(id, admin)).rejects.toMatchObject({ status: 409 })
  })

  it('responde 404 si el pedido no existe', async () => {
    await expect(marcarContactado(new Types.ObjectId().toString(), admin)).rejects.toMatchObject({ status: 404 })
  })
})

describe('registrarAcuerdo', () => {
  async function recien() {
    const { input } = await pedidoBase()
    return (await crearPedido(input)).id as string
  }

  it('guarda fecha acordada, entrega y anticipo; el anticipo lleva su fecha de registro', async () => {
    const id = await recien()

    await registrarAcuerdo(id, {
      fechaEntrega: new Date('2026-12-14T15:00:00.000Z'),
      entrega: { metodo: 'domicilio', detalle: 'Cra 5 # 10-20' },
      pago: { monto: 50000, medio: 'bancolombia' },
    })

    const pedido = await Pedido.findById(id).lean()
    expect(pedido!.fechaEntrega!.toISOString()).toBe('2026-12-14T15:00:00.000Z')
    expect(pedido!.entrega).toEqual({ metodo: 'domicilio', detalle: 'Cra 5 # 10-20' })
    expect(pedido!.pago).toMatchObject({ monto: 50000, medio: 'bancolombia' })
    expect(pedido!.pago!.registradoEn).toBeInstanceOf(Date)
  })

  it('null en fechaEntrega la borra y omitirla no la toca', async () => {
    const id = await recien()
    await registrarAcuerdo(id, { fechaEntrega: new Date('2026-12-14T15:00:00.000Z') })

    await registrarAcuerdo(id, { pago: { monto: 1000, medio: 'efectivo' } })
    expect((await Pedido.findById(id).lean())!.fechaEntrega).not.toBeNull()

    await registrarAcuerdo(id, { fechaEntrega: null })
    expect((await Pedido.findById(id).lean())!.fechaEntrega).toBeNull()
  })

  it.each(['entregado', 'cancelado'] as const)('rechaza con 409 un pedido %s', async (estado) => {
    const id = await recien()
    await Pedido.updateOne({ _id: id }, { estado })
    await expect(registrarAcuerdo(id, { fechaEntrega: null })).rejects.toMatchObject({ status: 409 })
  })

  describe('en un pedido ya confirmado', () => {
    const FECHA = '2026-12-12T17:00:00.000Z'

    async function confirmado() {
      const id = await recien()
      await Pedido.updateOne(
        { _id: id },
        { estado: 'confirmado', contactadoEn: new Date(), fechaEntrega: new Date(FECHA) },
      )
      return id
    }

    it('no deja borrar la fecha acordada y no guarda nada', async () => {
      const id = await confirmado()

      await expect(registrarAcuerdo(id, { fechaEntrega: null })).rejects.toMatchObject({
        status: 409,
        message: expect.stringMatching(/la fecha de entrega acordada/),
      })

      expect((await Pedido.findById(id).lean())!.fechaEntrega!.toISOString()).toBe(FECHA)
    })

    it('no deja pasar a domicilio sin direccion', async () => {
      const id = await confirmado()

      await expect(
        registrarAcuerdo(id, { entrega: { metodo: 'domicilio', detalle: '' } }),
      ).rejects.toMatchObject({ status: 409, message: expect.stringMatching(/la dirección de entrega/) })

      expect((await Pedido.findById(id).lean())!.entrega.metodo).toBe('recoger')
    })

    it('un cambio que mantiene lo exigido se guarda', async () => {
      const id = await confirmado()

      await registrarAcuerdo(id, {
        fechaEntrega: new Date('2026-12-19T17:00:00.000Z'),
        entrega: { metodo: 'domicilio', detalle: 'Cra 5 # 10-20' },
      })

      const pedido = (await Pedido.findById(id).lean())!
      expect(pedido.fechaEntrega!.toISOString()).toBe('2026-12-19T17:00:00.000Z')
      expect(pedido.entrega).toEqual({ metodo: 'domicilio', detalle: 'Cra 5 # 10-20' })
    })
  })

  it('antes de confirmar, en en_revision, la fecha acordada se puede borrar', async () => {
    const id = await recien()
    await Pedido.updateOne({ _id: id }, { estado: 'en_revision', fechaEntrega: new Date('2026-12-12T17:00:00.000Z') })

    await registrarAcuerdo(id, { fechaEntrega: null })

    expect((await Pedido.findById(id).lean())!.fechaEntrega).toBeNull()
  })
})

describe('cancelarMiPedido', () => {
  async function solicitud() {
    const { input, cliente } = await pedidoBase()
    const pedido = await crearPedido(input)
    return { id: pedido.id as string, clienteId: cliente.id as string }
  }

  it('cancela lo propio en recibido y deja al cliente como actor, sin exponerlo de vuelta', async () => {
    const { id, clienteId } = await solicitud()

    const devuelto = await cancelarMiPedido(id, clienteId)

    expect(devuelto!.estado).toBe('cancelado')
    expect(devuelto!.historialEstados.at(-1)).not.toHaveProperty('actor')
    const guardado = await Pedido.findById(id).lean()
    expect(guardado!.historialEstados.at(-1)!.actor.toString()).toBe(clienteId)
  })

  it('cancela desde en_revision', async () => {
    const { id, clienteId } = await solicitud()
    await Pedido.updateOne({ _id: id }, { estado: 'en_revision' })
    await expect(cancelarMiPedido(id, clienteId)).resolves.toBeTruthy()
  })

  it.each(['confirmado', 'en_produccion', 'entregado'] as const)(
    'desde %s rechaza con 409 y manda a WhatsApp',
    async (estado) => {
      const { id, clienteId } = await solicitud()
      await Pedido.updateOne({ _id: id }, { estado })

      const error = await cancelarMiPedido(id, clienteId).catch((e: unknown) => e as AppError)

      expect(error).toBeInstanceOf(AppError)
      expect((error as AppError).status).toBe(409)
      expect((error as AppError).message).toMatch(/WhatsApp/)
      expect((await Pedido.findById(id).lean())!.estado).toBe(estado)
    },
  )

  it('responde 404 si el pedido es de otro cliente', async () => {
    const { id } = await solicitud()
    const otro = await Usuario.create({ nombre: 'Otra', email: 'otra@taju.co', password: 'hash-no-relevante' })
    await expect(cancelarMiPedido(id, otro.id)).rejects.toMatchObject({ status: 404 })
    expect((await Pedido.findById(id).lean())!.estado).toBe('recibido')
  })

  it('es idempotente: cancelar dos veces no falla ni duplica el historial', async () => {
    const { id, clienteId } = await solicitud()

    await cancelarMiPedido(id, clienteId)
    await expect(cancelarMiPedido(id, clienteId)).resolves.toBeTruthy()

    const historial = (await Pedido.findById(id).lean())!.historialEstados
    expect(historial.filter((h) => h.estadoNuevo === 'cancelado')).toHaveLength(1)
  })
})

// ─── Concurrencia y documentos legados ──────────────────────────────────────

describe('concurrencia sobre el mismo pedido', () => {
  const admin = new Types.ObjectId().toString()

  it('si el cliente cancela mientras el taller avanza, el que llega tarde pierde y el historial queda coherente', async () => {
    const { input, cliente } = await pedidoBase()
    const id = (await crearPedido(input)).id as string
    const clienteId = cliente.id as string

    // el taller lee el pedido; antes de que guarde, la cancelacion del cliente llega completa
    const findByIdReal = Pedido.findById.bind(Pedido)
    vi.spyOn(Pedido, 'findById').mockImplementationOnce((async () => {
      const leido = await findByIdReal(id)
      await cancelarMiPedido(id, clienteId)
      return leido
    }) as unknown as typeof Pedido.findById)

    const error = await updateEstado(id, 'en_revision', admin).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(mongoose.Error.VersionError)
    const final = (await Pedido.findById(id).lean())!
    expect(final.estado).toBe('cancelado')
    expect(final.historialEstados.map((h) => h.estadoNuevo)).toEqual(['recibido', 'cancelado'])
  })
})

describe('faltantesParaAvanzar con un pedido legado', () => {
  it('un pedido sin entrega responde 409 con lo que falta, no un error interno', async () => {
    const { input } = await pedidoBase()
    const id = (await crearPedido(input)).id as string
    await Pedido.collection.updateOne({ _id: new Types.ObjectId(id) }, { $unset: { entrega: '' }, $set: { estado: 'en_revision' } })

    const error = await updateEstado(id, 'confirmado', new Types.ObjectId().toString()).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(AppError)
    expect((error as AppError).status).toBe(409)
    expect((error as AppError).message).toMatch(/la fecha de entrega acordada/)
  })
})
