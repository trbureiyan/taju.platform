import { Schema, model, Document, Types } from 'mongoose'
import {
  ESTADOS_PEDIDO,
  FAMILIAS,
  MEDIOS_PAGO,
  METODOS_ENTREGA,
  type EstadoPedido,
  type Familia,
  type MedioPago,
  type MetodoEntrega,
} from '../types/index.js'

// ─── Subdocumentos ────────────────────────────────────────────────────────────

// subdocumento embebido intencional: guarda foto de la categoria al momento del pedido,
// si luego la renombran o cambian de familia el historico no se altera
interface ICategoriaEmbebida {
  _id: Types.ObjectId
  nombre: string
  familia: Familia
}

// mismo patron de snapshot que categoria - sin esto, dos pedidos de productos distintos en la misma
// categoria son indistinguibles para el admin (ver AdminPedidosPage)
interface IProductoEmbebido {
  _id: Types.ObjectId
  nombre: string
}

// esDimensionPersonalizada bloquea el avance a "en_produccion" hasta que el admin confirme a mano
// (ver confirmacionDimensionPersonalizada en IPedido y el chequeo en pedidos.service.ts)
interface IDimensiones {
  valor: number
  unidad: 'cm'
  esDimensionPersonalizada: boolean
}

// una por cada foto que el cliente adjunto al pedir - mimeType fijo porque upload.ts solo deja pasar JPG
interface IImagenReferencia {
  nombreOriginal: string
  mimeType: 'image/jpeg'
  tamano: number
  url: string
}

// auditoria de cada cambio de estado - quien lo movio y cuando, para reclamos y seguimiento
interface IHistorialEstado {
  estadoAnterior: EstadoPedido | null
  estadoNuevo: EstadoPedido
  fecha: Date
  actor: Types.ObjectId
}

// snapshot del cliente al pedir - si luego cambia de celular, el taller conserva el numero con el que se hablo
interface IContacto {
  nombre: string
  telefono: string
}

// detalle es la direccion o el barrio; con "recoger" queda vacio
interface IEntrega {
  metodo: MetodoEntrega
  detalle: string
}

// anticipo registrado a mano por el taller - constancia, no una transaccion
interface IPago {
  monto: number
  medio: MedioPago
  registradoEn: Date
}

// ─── Documento principal ──────────────────────────────────────────────────────

export interface IPedido extends Document {
  cliente: Types.ObjectId
  producto: IProductoEmbebido
  categoria: ICategoriaEmbebida
  descripcion: string
  dimensiones: IDimensiones
  cantidad: number
  colores: string
  materiales: string
  imagenesReferencia: IImagenReferencia[]
  estado: EstadoPedido
  fechaSolicitud: Date
  contacto: IContacto
  entrega: IEntrega
  // lo que pidio el cliente; fechaEntrega es la acordada y solo la fija el taller
  fechaDeseada: Date | null
  fechaEntrega: Date | null
  pago: IPago | null
  // primera vez que el taller le escribio al cliente; mide la promesa de contacto
  contactadoEn: Date | null
  // el admin la marca explicito antes de avanzar a en_produccion cuando esDimensionPersonalizada es true
  confirmacionDimensionPersonalizada: boolean
  historialEstados: IHistorialEstado[]
}

// ─── Schemas ──────────────────────────────────────────────────────────────────
// { _id: false } en cada subdocumento: son datos embebidos, no entidades propias con su ciclo de vida

const categoriaEmbebidaSchema = new Schema<ICategoriaEmbebida>(
  {
    _id: { type: Schema.Types.ObjectId, required: true },
    nombre: { type: String, required: true },
    familia: { type: String, required: true, enum: FAMILIAS },
  },
  { _id: false },
)

const productoEmbebidoSchema = new Schema<IProductoEmbebido>(
  {
    _id: { type: Schema.Types.ObjectId, required: true },
    nombre: { type: String, required: true },
  },
  { _id: false },
)

const dimensionesSchema = new Schema<IDimensiones>(
  {
    valor: { type: Number, required: true },
    unidad: { type: String, default: 'cm' },
    esDimensionPersonalizada: { type: Boolean, required: true },
  },
  { _id: false },
)

const imagenReferenciaSchema = new Schema<IImagenReferencia>(
  {
    nombreOriginal: { type: String, required: true },
    mimeType: { type: String, default: 'image/jpeg' },
    tamano: { type: Number, required: true },
    url: { type: String, required: true },
  },
  { _id: false },
)

const historialEstadoSchema = new Schema<IHistorialEstado>(
  {
    estadoAnterior: { type: String, enum: [...ESTADOS_PEDIDO, null], default: null },
    estadoNuevo: { type: String, required: true, enum: ESTADOS_PEDIDO },
    fecha: { type: Date, default: Date.now },
    actor: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  },
  { _id: false },
)

const contactoSchema = new Schema<IContacto>(
  { nombre: { type: String, required: true }, telefono: { type: String, required: true } },
  { _id: false },
)

const entregaSchema = new Schema<IEntrega>(
  { metodo: { type: String, enum: METODOS_ENTREGA, required: true }, detalle: { type: String, default: '' } },
  { _id: false },
)

const pagoSchema = new Schema<IPago>(
  {
    monto: { type: Number, required: true, min: 1 },
    medio: { type: String, enum: MEDIOS_PAGO, required: true },
    registradoEn: { type: Date, default: Date.now },
  },
  { _id: false },
)

// timestamps no viene de aqui: fechaSolicitud es explicito porque queremos ese nombre en la API,
// no createdAt/updatedAt genericos de mongoose
const pedidoSchema = new Schema<IPedido>({
  cliente: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  producto: { type: productoEmbebidoSchema, required: true },
  categoria: { type: categoriaEmbebidaSchema, required: true },
  descripcion: { type: String, required: true },
  dimensiones: { type: dimensionesSchema, required: true },
  cantidad: { type: Number, required: true, min: 1 },
  colores: { type: String, required: true },
  materiales: { type: String, required: true },
  imagenesReferencia: { type: [imagenReferenciaSchema], default: [] },
  estado: { type: String, enum: ESTADOS_PEDIDO, default: 'recibido' },
  fechaSolicitud: { type: Date, default: Date.now },
  contacto: { type: contactoSchema, required: true },
  entrega: { type: entregaSchema, required: true },
  fechaDeseada: { type: Date, default: null },
  fechaEntrega: { type: Date, default: null },
  pago: { type: pagoSchema, default: null },
  contactadoEn: { type: Date, default: null },
  confirmacionDimensionPersonalizada: { type: Boolean, default: false },
  historialEstados: [historialEstadoSchema],
},
// [DECISION] optimisticConcurrency: los servicios leen, validan el estado en memoria y guardan. Sin chequear
// __v, una cancelacion del cliente y un avance del taller simultaneos ganaban los dos. El perdedor recibe
// VersionError, que errorHandler traduce a 409
{ optimisticConcurrency: true })

// ─── Indices ──────────────────────────────────────────────────────────────────
// las tres vistas que mas se consultan: "mis pedidos", el tablero del taller por estado,
// y filtrar los que necesitan revision manual de dimension
pedidoSchema.index({ cliente: 1, estado: 1 })
pedidoSchema.index({ estado: 1, fechaSolicitud: -1 })
pedidoSchema.index({ 'dimensiones.esDimensionPersonalizada': 1 })

export const Pedido = model<IPedido>('Pedido', pedidoSchema)
