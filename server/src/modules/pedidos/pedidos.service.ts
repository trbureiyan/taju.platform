import { createHash } from 'node:crypto'
import mongoose, { Types } from 'mongoose'
import { Pedido } from '../../models/Pedido.js'
import { Categoria } from '../../models/Categoria.js'
import { Producto } from '../../models/Producto.js'
import { IdempotenciaPedido } from '../../models/IdempotenciaPedido.js'
import { subirImagen, eliminarImagen } from '../../lib/cloudinary.js'
import { ESTADOS_PEDIDO, type EstadoPedido } from '../../types/index.js'
import { AppError } from '../../lib/errors.js'

// ─── Creacion ─────────────────────────────────────────────────────────────────

// cubre doble click y reintentos de red, que llegan en segundos; mas largo empezaria a frenar pedidos legitimos
const VENTANA_IDEMPOTENCIA_MS = 60_000

const MENSAJE_PEDIDO_DUPLICADO =
  'Ya recibimos este mismo pedido hace un momento. Revisa Mis pedidos antes de enviarlo otra vez.'

// [DECISION] clave = hash de clienteId + productoId + fechaEntrega + el resto de la especificacion, no solo los
// tres primeros - un doble click o un reintento mandan el payload identico, asi que igual se detectan, y un
// cliente profesional que pide dos variantes del mismo producto para la misma fecha no queda bloqueado.
// Los archivos entran como hash de su contenido, no como nombre/tamano: dos pedidos con el mismo texto pero
// fotos de referencia distintas son pedidos distintos, y metadata (nombre, peso) no lo garantiza igual que el
// contenido. El hash es rapido (sha256 sobre <=3 buffers de max 5 MB), no vale la pena optimizarlo.
function claveIdempotencia(input: CrearPedidoInput): string {
  const partes = [
    input.clienteId,
    input.productoId,
    input.categoriaId,
    input.fechaEntrega?.toISOString() ?? 'sin-fecha',
    input.descripcion.trim(),
    input.dimensionValor,
    input.esDimensionPersonalizada,
    input.cantidad,
    input.colores.trim(),
    input.materiales.trim(),
    input.archivos.map((archivo) => createHash('sha256').update(archivo.buffer).digest('hex')),
  ]
  return createHash('sha256').update(JSON.stringify(partes)).digest('hex')
}

function esClaveDuplicada(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000
}

interface CrearPedidoInput {
  clienteId: string
  productoId: string
  categoriaId: string
  descripcion: string
  dimensionValor: number
  esDimensionPersonalizada: boolean
  cantidad: number
  colores: string
  materiales: string
  fechaEntrega: Date | null
  archivos: Express.Multer.File[]
}

/**
 * Crea un pedido nuevo con sus imagenes de referencia, protegido contra duplicados.
 * @param input - Datos del formulario de pedido, incluidos los archivos ya validados por uploadImagen.
 * @returns El documento del pedido recien creado.
 * @throws AppError(400) si la categoria o el producto no existen o estan inactivos.
 * @throws AppError(409) si el mismo pedido (mismo cliente, especificacion y archivos) ya se recibio
 *         en los ultimos 60 s - ver claveIdempotencia.
 */
export async function crearPedido(input: CrearPedidoInput) {
  // no se puede pedir sobre una categoria borrada ni pausada - evita pedidos huerfanos de algo que ya no se vende
  const categoria = await Categoria.findById(input.categoriaId)
  if (!categoria || !categoria.activo) {
    throw new AppError(400, 'Categoría no encontrada o inactiva')
  }

  // sin esto dos pedidos de productos distintos en la misma categoria quedan indistinguibles para el admin
  const producto = await Producto.findById(input.productoId)
  if (!producto || !producto.activo) {
    throw new AppError(400, 'Producto no encontrado o inactivo')
  }

  const clave = claveIdempotencia(input)

  // chequeo barato fuera de la transaccion: corta el reintento secuencial antes de gastar subidas a Cloudinary.
  // no es la garantia - dos requests simultaneos pasan este punto juntos, eso lo resuelve la transaccion de abajo
  const reservaVigente = await IdempotenciaPedido.exists({ _id: clave, expiraEn: { $gt: new Date() } })
  if (reservaVigente) throw new AppError(409, MENSAJE_PEDIDO_DUPLICADO)

  // [DECISION] las subidas van antes y fuera de la transaccion - una transaccion abierta durante I/O externo
  // arriesga el limite de 60s de Mongo. Tradeoff: el perdedor de una carrera simultanea sube igual sus imagenes;
  // se limpian en el catch de abajo apenas se confirma que perdio, asi que quedan huerfanas solo el tiempo
  // que dura esa subida, no indefinidamente.
  // Promise.all para subir las referencias en paralelo, son maximo 3 asi que no vale la pena serializar
  const imagenesReferencia = await Promise.all(
    input.archivos.map(async (file) => {
      const { url, publicId } = await subirImagen(file.buffer, file.mimetype)
      return {
        nombreOriginal: file.originalname,
        mimeType: 'image/jpeg' as const,
        tamano: file.size,
        url,
        publicId,
      }
    }),
  )

  // [DECISION] withTransaction en vez de startTransaction/commit a mano - reintenta solo ante
  // TransientTransactionError, que es justo lo que recibe el perdedor de dos inserts simultaneos de la misma
  // clave; en el reintento ve la reserva ya confirmada y cae en E11000 -> 409. Requiere replica set (Atlas M0 lo es).
  const session = await mongoose.startSession()
  let pedidoId: Types.ObjectId | undefined
  try {
    await session.withTransaction(async () => {
      const ahora = new Date()
      // reserva vencida que el monitor TTL todavia no borro: se libera aqui, dentro de la misma transaccion
      await IdempotenciaPedido.deleteOne({ _id: clave, expiraEn: { $lte: ahora } }, { session })
      pedidoId = new Types.ObjectId()
      await IdempotenciaPedido.create(
        [{ _id: clave, pedido: pedidoId, expiraEn: new Date(ahora.getTime() + VENTANA_IDEMPOTENCIA_MS) }],
        { session },
      )
      await Pedido.create([armarPedido(pedidoId, input, producto, categoria, imagenesReferencia)], { session })
    })
  } catch (err) {
    // la transaccion no se confirmo, sea por clave duplicada o cualquier otra causa (validacion,
    // TransientTransactionError agotado, fallo de commit) - las imagenes ya subidas quedan sin
    // pedido que las referencie. allSettled a proposito: si Cloudinary falla ahora, igual
    // propagamos el error original de la transaccion, no lo tapamos con uno de limpieza
    await Promise.allSettled(imagenesReferencia.map((img) => eliminarImagen(img.publicId)))
    if (esClaveDuplicada(err)) throw new AppError(409, MENSAJE_PEDIDO_DUPLICADO)
    throw err
  } finally {
    await session.endSession()
  }

  // fuera del try/catch de la transaccion a proposito - si esta consulta falla, el pedido ya se
  // confirmo y sus imagenes SI le pertenecen, no hay que limpiarlas como si hubiera perdido
  const pedido = await Pedido.findById(pedidoId)
  if (!pedido) throw new Error('Pedido confirmado en la transaccion pero no encontrado')
  return pedido
}

/**
 * Arma el documento de pedido a partir del input validado y los snapshots de producto/categoria.
 * No toca la base de datos - solo construye el objeto que crearPedido persiste dentro de la transaccion.
 */
function armarPedido(
  pedidoId: Types.ObjectId,
  input: CrearPedidoInput,
  producto: { _id: Types.ObjectId; nombre: string },
  categoria: { _id: Types.ObjectId; nombre: string; familia: string },
  imagenesReferencia: { nombreOriginal: string; mimeType: 'image/jpeg'; tamano: number; url: string }[],
) {
  return {
    _id: pedidoId,
    cliente: input.clienteId,
    // snapshot de producto y categoria al momento del pedido - si luego cambian nombre o se desactivan,
    // el historico de este pedido no se altera (ver IProductoEmbebido/ICategoriaEmbebida en el modelo)
    producto: {
      _id: producto._id,
      nombre: producto.nombre,
    },
    categoria: {
      _id: categoria._id,
      nombre: categoria.nombre,
      familia: categoria.familia,
    },
    descripcion: input.descripcion,
    dimensiones: {
      valor: input.dimensionValor,
      unidad: 'cm',
      esDimensionPersonalizada: input.esDimensionPersonalizada,
    },
    cantidad: input.cantidad,
    colores: input.colores,
    materiales: input.materiales,
    imagenesReferencia,
    estado: 'recibido',
    fechaEntrega: input.fechaEntrega,
    // arranca su propio historial desde el momento cero, el cliente es el "actor" de este primer paso
    historialEstados: [
      {
        estadoAnterior: null,
        estadoNuevo: 'recibido',
        fecha: new Date(),
        actor: new Types.ObjectId(input.clienteId),
      },
    ],
  }
}

// ─── Consultas del cliente ──────────────────────────────────────────────────

export async function getMisPedidos(clienteId: string) {
  return Pedido.find({ cliente: clienteId }).sort({ fechaSolicitud: -1 }).lean()
}

// el filtro por clienteId no es solo prolijidad: es lo unico que impide que un cliente lea el pedido de otro
export async function getPedidoById(pedidoId: string, clienteId: string) {
  const pedido = await Pedido.findOne({ _id: pedidoId, cliente: clienteId }).lean()
  if (!pedido) throw new AppError(404, 'Pedido no encontrado')
  return pedido
}

// ─── Panel de taller (admin) ────────────────────────────────────────────────

// el orden de la constante canonica ES la maquina de estados - updateEstado solo permite moverse al siguiente indice
const ORDEN_ESTADOS: readonly EstadoPedido[] = ESTADOS_PEDIDO

// sin filtro de cliente: esta vista es solo para el rol administrador (ver requireRol en las rutas)
export async function getAllPedidos() {
  return Pedido.find().sort({ fechaSolicitud: -1 }).populate('cliente', 'email').lean()
}

// null es valida - "todavia no sabemos cuando" es un estado legitimo, no un error
export async function setFechaEntrega(pedidoId: string, fecha: Date | null) {
  const pedido = await Pedido.findById(pedidoId)
  if (!pedido) throw new AppError(404, 'Pedido no encontrado')
  pedido.fechaEntrega = fecha
  await pedido.save()
  // populate('cliente', 'email').lean() para igualar el contrato de retorno de updateEstado
  return Pedido.findById(pedidoId).populate('cliente', 'email').lean()
}

// confirmarDimensionPersonalizada: el admin lo manda explicito en el mismo request que avanza a en_produccion -
// no hay endpoint separado porque la confirmacion no tiene sentido fuera de esa transicion puntual
export async function updateEstado(
  pedidoId: string,
  nuevoEstado: EstadoPedido,
  actorId: string,
  confirmarDimensionPersonalizada = false,
) {
  const pedido = await Pedido.findById(pedidoId)
  if (!pedido) throw new AppError(404, 'Pedido no encontrado')

  // solo se avanza un paso a la vez, nada de saltarse "en_produccion" ni retroceder
  const indexActual = ORDEN_ESTADOS.indexOf(pedido.estado as EstadoPedido)
  const indexNuevo = ORDEN_ESTADOS.indexOf(nuevoEstado)
  if (indexNuevo !== indexActual + 1) {
    throw new AppError(409, `Transición inválida: ${pedido.estado} → ${nuevoEstado}`)
  }

  // dimension personalizada exige confirmacion manual del admin antes de entrar a produccion
  if (nuevoEstado === 'en_produccion' && pedido.dimensiones.esDimensionPersonalizada) {
    if (!pedido.confirmacionDimensionPersonalizada && !confirmarDimensionPersonalizada) {
      throw new AppError(
        409,
        'Este pedido tiene una dimensión personalizada y necesita tu confirmación antes de pasar a producción',
      )
    }
    pedido.confirmacionDimensionPersonalizada = true
  }

  // el push queda en el mismo .save() que el cambio de estado - no hay ventana donde uno se guarde sin el otro
  const estadoAnterior = pedido.estado
  pedido.estado = nuevoEstado
  pedido.historialEstados.push({
    estadoAnterior,
    estadoNuevo: nuevoEstado,
    fecha: new Date(),
    actor: new Types.ObjectId(actorId),
  })

  await pedido.save()
  return Pedido.findById(pedidoId).populate('cliente', 'email').lean()
}
