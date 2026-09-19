import { Schema, model, Document, Types } from 'mongoose'

export interface IProducto extends Document {
  nombre: string
  descripcionTecnica: string
  // referencia viva, no snapshot como en Pedido - un producto siempre muestra los datos actuales de su categoria
  categoria: Types.ObjectId
  // pares libres (material, acabado, etc) - varian tanto entre familias que no vale la pena un schema rigido aqui
  especificacionesTecnicas: Map<string, string>
  imagenes: string[] // urls de cloudinary, en orden - la primera es la que se usa como miniatura del catalogo
  activo: boolean
}

const productoSchema = new Schema<IProducto>({
  nombre: { type: String, required: true, trim: true },
  descripcionTecnica: { type: String, default: '' },
  categoria: { type: Schema.Types.ObjectId, ref: 'Categoria', required: true },
  especificacionesTecnicas: { type: Map, of: String, default: {} },
  imagenes: { type: [String], default: [] },
  activo: { type: Boolean, default: true },
})

productoSchema.index({ categoria: 1, activo: 1 })

export const Producto = model<IProducto>('Producto', productoSchema)
