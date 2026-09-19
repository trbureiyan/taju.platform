import { Schema, model, Document } from 'mongoose'
import type { Familia } from '../types/index.js'

// las dimensiones tipicas de esa categoria (ej. "media libra" -> 22cm), para sugerir en el formulario
interface IDimensionBase {
  etiqueta: string
  valor: number
  unidad: 'cm'
}

// activo controla visibilidad publica sin borrar la categoria - queda oculta pero el historico de pedidos
// que la usaron sigue intacto (ver ICategoriaEmbebida en Pedido.ts)
export interface ICategoria extends Document {
  nombre: string
  descripcion: string
  familia: Familia
  dimensionesBase: IDimensionBase[]
  activo: boolean
}

const dimensionBaseSchema = new Schema<IDimensionBase>(
  {
    etiqueta: { type: String, required: true },
    valor: { type: Number, required: true },
    unidad: { type: String, default: 'cm' },
  },
  { _id: false },
)

const categoriaSchema = new Schema<ICategoria>({
  nombre: { type: String, required: true, trim: true },
  descripcion: { type: String, default: '' },
  // las 4 familias en linea aqui (Pedido.ts las trae de un const compartido) - si se agrega una familia,
  // acordarse de actualizar los dos lugares
  familia: {
    type: String,
    required: true,
    enum: ['toppers', 'superficies', 'senaletica', 'papeleria'],
  },
  dimensionesBase: { type: [dimensionBaseSchema], default: [] },
  activo: { type: Boolean, default: true },
})

categoriaSchema.index({ familia: 1, activo: 1 })

export const Categoria = model<ICategoria>('Categoria', categoriaSchema)
