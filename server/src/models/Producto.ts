import { Schema, model, Document, Types } from 'mongoose'

// [DECISION] precio.escalas cubre solo la familia `superficies` (minimo 12 unidades, ver AGENTS.md);
// las demas familias usan precio.unitario. Ambos campos coexisten porque un producto no cambia de
// familia despues de creado, pero el schema no lo restringe a nivel de tipo - el service lo valida.
interface IEscalaPrecio {
  cantidadMinima: number
  precioUnitario: number
}

interface IPrecio {
  unitario: number | null
  escalas: IEscalaPrecio[]
}

export interface IProducto extends Document {
  nombre: string
  descripcionTecnica: string
  // referencia viva, no snapshot como en Pedido - un producto siempre muestra los datos actuales de su categoria
  categoria: Types.ObjectId
  // pares libres (material, acabado, etc) - varian tanto entre familias que no vale la pena un schema rigido aqui
  especificacionesTecnicas: Map<string, string>
  imagenes: string[] // urls de cloudinary, en orden - la primera es la que se usa como miniatura del catalogo
  precio: IPrecio
  activo: boolean
}

const escalaPrecioSchema = new Schema<IEscalaPrecio>(
  {
    cantidadMinima: { type: Number, required: true, min: 1 },
    precioUnitario: { type: Number, required: true, min: 0 },
  },
  { _id: false },
)

const precioSchema = new Schema<IPrecio>(
  {
    unitario: { type: Number, default: null, min: 0 },
    escalas: { type: [escalaPrecioSchema], default: [] },
  },
  { _id: false },
)

const productoSchema = new Schema<IProducto>({
  nombre: { type: String, required: true, trim: true },
  descripcionTecnica: { type: String, default: '' },
  categoria: { type: Schema.Types.ObjectId, ref: 'Categoria', required: true },
  especificacionesTecnicas: { type: Map, of: String, default: {} },
  imagenes: { type: [String], default: [] },
  precio: { type: precioSchema, default: () => ({ unitario: null, escalas: [] }) },
  activo: { type: Boolean, default: true },
})

productoSchema.index({ categoria: 1, activo: 1 })

export const Producto = model<IProducto>('Producto', productoSchema)
