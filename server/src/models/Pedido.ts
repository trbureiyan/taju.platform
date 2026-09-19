import { Schema, model, Document, Types } from 'mongoose'
import { ESTADOS_PEDIDO, FAMILIAS, type EstadoPedido, type Familia } from '../types/index.js'

// ─── Subdocumentos ────────────────────────────────────────────────────────────

// subdocumento embebido intencional: guarda foto de la categoria al momento del pedido,
// si luego la renombran o cambian de familia el historico no se altera
interface ICategoriaEmbebida {
  _id: Types.ObjectId
  nombre: string
  familia: Familia
}

// esDimensionPersonalizada bloquea el avance a "en_produccion" hasta que el admin confirme a mano
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

// ─── Documento principal ──────────────────────────────────────────────────────

export interface IPedido extends Document {
  cliente: Types.ObjectId
  categoria: ICategoriaEmbebida
  descripcion: string
  dimensiones: IDimensiones
  cantidad: number
  colores: string
  materiales: string
  imagenesReferencia: IImagenReferencia[]
  estado: EstadoPedido
  fechaSolicitud: Date
  fechaEstimadaEntrega: Date | null
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

// timestamps no viene de aqui: fechaSolicitud es explicito porque queremos ese nombre en la API,
// no createdAt/updatedAt genericos de mongoose
const pedidoSchema = new Schema<IPedido>({
  cliente: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  categoria: { type: categoriaEmbebidaSchema, required: true },
  descripcion: { type: String, required: true },
  dimensiones: { type: dimensionesSchema, required: true },
  cantidad: { type: Number, required: true, min: 1 },
  colores: { type: String, required: true },
  materiales: { type: String, required: true },
  imagenesReferencia: { type: [imagenReferenciaSchema], default: [] },
  estado: { type: String, enum: ESTADOS_PEDIDO, default: 'pendiente' },
  fechaSolicitud: { type: Date, default: Date.now },
  fechaEstimadaEntrega: { type: Date, default: null },
  historialEstados: [historialEstadoSchema],
})

// ─── Indices ──────────────────────────────────────────────────────────────────
// las tres vistas que mas se consultan: "mis pedidos", el tablero del taller por estado,
// y filtrar los que necesitan revision manual de dimension
pedidoSchema.index({ cliente: 1, estado: 1 })
pedidoSchema.index({ estado: 1, fechaSolicitud: -1 })
pedidoSchema.index({ 'dimensiones.esDimensionPersonalizada': 1 })

export const Pedido = model<IPedido>('Pedido', pedidoSchema)
