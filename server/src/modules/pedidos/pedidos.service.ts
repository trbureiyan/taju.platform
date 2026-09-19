import { Types } from 'mongoose'
import { Pedido } from '../../models/Pedido.js'
import { Categoria } from '../../models/Categoria.js'
import { Producto } from '../../models/Producto.js'
import { subirImagen } from '../../lib/cloudinary.js'
import { ESTADOS_PEDIDO, type EstadoPedido } from '../../types/index.js'
import { AppError } from '../../lib/errors.js'

// ─── Creacion ─────────────────────────────────────────────────────────────────

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

  // Promise.all para subir las referencias en paralelo, son maximo 3 asi que no vale la pena serializar
  const imagenesReferencia = await Promise.all(
    input.archivos.map(async (file) => ({
      nombreOriginal: file.originalname,
      mimeType: 'image/jpeg' as const,
      tamano: file.size,
      url: await subirImagen(file.buffer, file.mimetype),
    })),
  )

  const pedido = await Pedido.create({
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
  })

  return pedido
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
  return pedido.toObject()
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
