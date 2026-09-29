import { createHash } from 'node:crypto'
import mongoose, { Types } from 'mongoose'
import { Pedido, type IPedido } from '../../models/Pedido.js'
import { Categoria } from '../../models/Categoria.js'
import { Producto } from '../../models/Producto.js'
import { Usuario } from '../../models/Usuario.js'
import { IdempotenciaPedido } from '../../models/IdempotenciaPedido.js'
import { subirImagen, eliminarImagen } from '../../lib/cloudinary.js'
import { FLUJO_PEDIDO, type EstadoPedido, type MedioPago, type MetodoEntrega } from '../../types/index.js'
import { AppError } from '../../lib/errors.js'
import { faltantesDeSolicitud } from './pedidos.requisitos.js'

// ─── Creacion ─────────────────────────────────────────────────────────────────

// cubre doble click y reintentos de red, que llegan en segundos; mas largo empezaria a frenar pedidos legitimos
const VENTANA_IDEMPOTENCIA_MS = 60_000

const MENSAJE_PEDIDO_DUPLICADO =
  'Ya recibimos este mismo pedido hace un momento. Revisa Mis pedidos antes de enviarlo otra vez.'

// [DECISION] clave = hash de clienteId + productoId + fechaDeseada + el resto de la especificacion, no solo los
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
    input.fechaDeseada?.toISOString() ?? 'sin-fecha',
    input.descripcion.trim(),
    input.dimensionValor,
    input.esDimensionPersonalizada,
    input.cantidad,
    input.colores.trim(),
    input.materiales.trim(),
    input.telefono,
    input.entregaMetodo,
    input.entregaDetalle.trim(),
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
  fechaDeseada: Date | null
  telefono: string
  entregaMetodo: MetodoEntrega
  entregaDetalle: string
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

  // antes de subir nada a Cloudinary: una solicitud incompleta no debe gastar subidas
  const faltan = faltantesDeSolicitud({
    familia: categoria.familia,
    fechaDeseada: input.fechaDeseada,
    cantidadReferencias: input.archivos.length,
  })
  if (faltan.length > 0) throw new AppError(400, faltan.join(' '))

  // el nombre viaja como snapshot en el pedido; sin cuenta no hay a quien escribirle ni de quien es el pedido
  const cliente = await Usuario.findById(input.clienteId).select('nombre').lean()
  if (!cliente) {
    throw new AppError(401, 'No encontramos tu cuenta. Vuelve a ingresar e inténtalo de nuevo.')
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
  interface ImagenSubida {
    nombreOriginal: string
    mimeType: 'image/jpeg'
    tamano: number
    url: string
    publicId: string
  }

  // [DECISION] allSettled y no Promise.all - con all, si una de varias subidas paralelas falla, las que
  // si terminaron quedan sin ninguna referencia (la asignacion completa nunca sucede) y jamas se limpian.
  // Con allSettled se sabe cuales terminaron para poder borrarlas antes de propagar el error.
  const resultadosSubida = await Promise.allSettled<ImagenSubida>(
    input.archivos.map(async (file) => {
      const { url, publicId } = await subirImagen(file.buffer, file.mimetype)
      return { nombreOriginal: file.originalname, mimeType: 'image/jpeg', tamano: file.size, url, publicId }
    }),
  )
  const subidasExitosas = resultadosSubida
    .filter((r): r is PromiseFulfilledResult<ImagenSubida> => r.status === 'fulfilled')
    .map((r) => r.value)
  const subidaFallida = resultadosSubida.find((r): r is PromiseRejectedResult => r.status === 'rejected')
  if (subidaFallida) {
    await Promise.allSettled(subidasExitosas.map((img) => eliminarImagen(img.publicId)))
    throw subidaFallida.reason
  }
  const imagenesReferencia = subidasExitosas

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
      await Pedido.create([armarPedido(pedidoId, input, producto, categoria, cliente, imagenesReferencia)], { session })
    })
  } catch (err) {
    // [DECISION] withTransaction puede lanzar por UnknownTransactionCommitResult aunque el commit haya
    // quedado aplicado en el servidor (ambiguedad de red justo despues de confirmar). Antes de asumir que
    // el pedido no se creo y borrar sus imagenes, verificamos el estado real en vez de confiar en la excepcion.
    if (pedidoId) {
      const pedidoQuizasCreado = await Pedido.findById(pedidoId)
      if (pedidoQuizasCreado) return pedidoQuizasCreado
    }
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
  cliente: { nombre: string },
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
    contacto: { nombre: cliente.nombre, telefono: input.telefono },
    entrega: { metodo: input.entregaMetodo, detalle: input.entregaDetalle.trim() },
    fechaDeseada: input.fechaDeseada,
    fechaEntrega: null,
    pago: null,
    contactadoEn: null,
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

// el cliente ve su propio historial, pero no quien lo movio - actor es dato interno del taller
const PROYECCION_SIN_ACTOR = { 'historialEstados.actor': 0 }

export async function getMisPedidos(clienteId: string) {
  return Pedido.find({ cliente: clienteId }, PROYECCION_SIN_ACTOR).sort({ fechaSolicitud: -1 }).lean()
}

// el filtro por clienteId no es solo prolijidad: es lo unico que impide que un cliente lea el pedido de otro
export async function getPedidoById(pedidoId: string, clienteId: string) {
  const pedido = await Pedido.findOne({ _id: pedidoId, cliente: clienteId }, PROYECCION_SIN_ACTOR).lean()
  if (!pedido) throw new AppError(404, 'Pedido no encontrado')
  return pedido
}

// ─── Panel de taller (admin) ────────────────────────────────────────────────

// [DECISION] tabla de transiciones y no el orden del enum - cancelado sale de tres estados distintos y no es
// "el siguiente" de ninguno. Producir es un compromiso: desde en_produccion ya no se cancela por aqui.
const TRANSICIONES: Record<EstadoPedido, readonly EstadoPedido[]> = {
  recibido: ['en_revision', 'cancelado'],
  en_revision: ['confirmado', 'cancelado'],
  confirmado: ['en_produccion', 'cancelado'],
  en_produccion: ['listo_para_entrega'],
  listo_para_entrega: ['entregado'],
  entregado: [],
  cancelado: [],
}

const LIMITE_MAXIMO_ADMIN = 100

/**
 * Lista pedidos del panel de taller con paginación.
 * @param limite - Pedidos por página. Default 50, máximo 100. Valores fuera de rango se sanitizan.
 * @param pagina - Página a devolver (base 1). Default 1. Valores menores a 1 se tratan como 1.
 * @returns Array de pedidos ordenados por fechaSolicitud desc, _id desc como desempate.
 */
// sin filtro de cliente: esta vista es solo para el rol administrador (ver requireRol en las rutas)
export async function getAllPedidos(limite = 50, pagina = 1) {
  const limiteSanitizado = Math.min(Math.max(1, limite), LIMITE_MAXIMO_ADMIN)
  const paginaSanitizada = Math.max(1, pagina)
  return Pedido.find()
    // _id como desempate: dos pedidos con la misma fechaSolicitud mantienen orden total y estable entre páginas
    .sort({ fechaSolicitud: -1, _id: -1 })
    .skip((paginaSanitizada - 1) * limiteSanitizado)
    .limit(limiteSanitizado)
    .populate('cliente', 'email')
    .lean()
}

export interface CambiosAcuerdo {
  // null es valida: "todavia no sabemos cuando" es un estado legitimo, no un error
  fechaEntrega?: Date | null
  entrega?: { metodo: MetodoEntrega; detalle: string }
  pago?: { monto: number; medio: MedioPago }
}

const ESTADOS_CERRADOS: readonly EstadoPedido[] = ['entregado', 'cancelado']

/**
 * Registra lo que TaJu y el cliente acordaron por fuera: fecha, entrega y anticipo.
 * @param cambios - Solo se tocan los campos presentes; `fechaEntrega: null` la borra.
 * @throws AppError(404) si el pedido no existe; AppError(409) si ya esta entregado o cancelado.
 */
export async function registrarAcuerdo(pedidoId: string, cambios: CambiosAcuerdo) {
  const pedido = await Pedido.findById(pedidoId)
  if (!pedido) throw new AppError(404, 'Pedido no encontrado')
  if (ESTADOS_CERRADOS.includes(pedido.estado)) {
    throw new AppError(409, 'Este pedido ya está cerrado y no admite cambios')
  }

  if (cambios.fechaEntrega !== undefined) pedido.fechaEntrega = cambios.fechaEntrega
  if (cambios.entrega) pedido.entrega = cambios.entrega
  // el anticipo lleva su propia fecha de registro: la plataforma deja constancia, no mueve dinero
  if (cambios.pago) pedido.pago = { ...cambios.pago, registradoEn: new Date() }

  // desde confirmado lo exigido para confirmar tiene que seguir en pie: sin esto un acuerdo posterior
  // podia dejar un pedido en produccion sin fecha o sin direccion. Se lanza antes del save, no queda nada escrito
  const comprometido =
    pedido.estado !== 'cancelado' && FLUJO_PEDIDO.indexOf(pedido.estado) >= FLUJO_PEDIDO.indexOf('confirmado')
  if (comprometido) {
    const faltan = faltantesParaAvanzar(pedido, 'confirmado')
    if (faltan.length > 0) {
      throw new AppError(409, `Este pedido ya está "${pedido.estado}" y no puede quedar sin: ${faltan.join(', ')}.`)
    }
  }

  await pedido.save()
  // populate('cliente', 'email').lean() para igualar el contrato de retorno de updateEstado
  return Pedido.findById(pedidoId).populate('cliente', 'email').lean()
}

/**
 * Marca que el taller ya le escribio al cliente. Desde `recibido` avanza a `en_revision` en el mismo gesto.
 * Idempotente: una segunda llamada no mueve la marca (el plazo de contacto se mide desde la primera).
 * @throws AppError(404) si no existe; AppError(409) si ya esta entregado o cancelado.
 */
export async function marcarContactado(pedidoId: string, actorId: string) {
  const pedido = await Pedido.findById(pedidoId)
  if (!pedido) throw new AppError(404, 'Pedido no encontrado')
  if (ESTADOS_CERRADOS.includes(pedido.estado)) throw new AppError(409, 'Este pedido ya está cerrado')

  if (!pedido.contactadoEn) {
    pedido.contactadoEn = new Date()
    if (pedido.estado === 'recibido') {
      pedido.historialEstados.push({
        estadoAnterior: 'recibido',
        estadoNuevo: 'en_revision',
        fecha: pedido.contactadoEn,
        actor: new Types.ObjectId(actorId),
      })
      pedido.estado = 'en_revision'
    }
  }

  await pedido.save()
  return Pedido.findById(pedidoId).populate('cliente', 'email').lean()
}

const ESTADOS_CANCELABLES_POR_CLIENTE: readonly EstadoPedido[] = ['recibido', 'en_revision']

/**
 * El cliente cancela su propia solicitud mientras el taller todavia no la confirma.
 * @throws AppError(404) si no existe o es de otro cliente (no se distingue a proposito);
 *         AppError(409) si ya esta confirmada o mas adelante: eso se habla por WhatsApp.
 */
export async function cancelarMiPedido(pedidoId: string, clienteId: string) {
  const pedido = await Pedido.findOne({ _id: pedidoId, cliente: clienteId })
  if (!pedido) throw new AppError(404, 'Pedido no encontrado')

  // doble clic o reintento de red: ya esta cancelado, no hay nada mas que hacer ni un segundo historial
  if (pedido.estado === 'cancelado') return Pedido.findById(pedidoId, PROYECCION_SIN_ACTOR).lean()

  if (!ESTADOS_CANCELABLES_POR_CLIENTE.includes(pedido.estado)) {
    throw new AppError(409, 'Tu pedido ya está confirmado. Escríbenos por WhatsApp y lo revisamos contigo.')
  }

  const estadoAnterior = pedido.estado
  pedido.estado = 'cancelado'
  pedido.historialEstados.push({
    estadoAnterior,
    estadoNuevo: 'cancelado',
    fecha: new Date(),
    actor: new Types.ObjectId(clienteId),
  })
  await pedido.save()
  return Pedido.findById(pedidoId, PROYECCION_SIN_ACTOR).lean()
}

/**
 * Lo que todavia no esta registrado para dar el paso a `destino`. Vacio significa que se puede avanzar.
 * [DECISION] confirmado = compromiso (hablamos, hay fecha y lugar); en_produccion exige anticipo. Sin esto
 * el taller trabaja sin saber cuando ni a quien entrega, ni si le pagan.
 */
function faltantesParaAvanzar(
  pedido: Pick<IPedido, 'contactadoEn' | 'fechaEntrega' | 'entrega' | 'pago'>,
  destino: EstadoPedido,
): string[] {
  const faltan: string[] = []
  if (destino === 'confirmado') {
    if (!pedido.contactadoEn) faltan.push('marcar que ya hablaste con el cliente')
    if (!pedido.fechaEntrega) faltan.push('la fecha de entrega acordada')
    // ?. por pedidos legados guardados antes de que existiera entrega: sin esto la compuerta da 500 y no 409
    if (pedido.entrega?.metodo === 'domicilio' && !pedido.entrega.detalle?.trim()) {
      faltan.push('la dirección de entrega')
    }
  }
  if (destino === 'en_produccion' && !pedido.pago) faltan.push('el anticipo')
  return faltan
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

  // solo se avanza un paso a la vez o se cancela; nada de saltarse "en_produccion" ni retroceder
  if (!TRANSICIONES[pedido.estado as EstadoPedido].includes(nuevoEstado)) {
    throw new AppError(409, `Transición inválida: ${pedido.estado} → ${nuevoEstado}`)
  }

  const faltan = faltantesParaAvanzar(pedido, nuevoEstado)
  if (faltan.length > 0) {
    throw new AppError(409, `Antes de pasar a "${nuevoEstado}" falta registrar: ${faltan.join(', ')}.`)
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
