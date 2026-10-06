import { Schema, model, Document } from 'mongoose'
import { ROLES, type Rol } from '../types/index.js'

export interface IUsuario extends Document {
  nombre: string
  email: string
  password: string // siempre el hash de bcrypt, jamas texto plano (ver auth.service.ts)
  rol: Rol
  fechaRegistro: Date
  autorizacionDatos?: { version: string; aceptadaEn: Date }
}

// subdocumento sin _id: las cuentas anteriores no lo tienen y no hay migración (campo ausente = sin autorización registrada)
const autorizacionSchema = new Schema(
  { version: { type: String, required: true }, aceptadaEn: { type: Date, required: true } },
  { _id: false },
)

const usuarioSchema = new Schema<IUsuario>({
  nombre: { type: String, required: true, trim: true },
  // lowercase + trim en el schema, no solo en el controller - asi ningun otro caller (script, seed) cuela variantes
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  // select: false por defecto - toJSON.transform solo protege serializacion, no .lean()/.toObject()/proyecciones.
  // auth.service.ts debe pedirlo explicito con .select('+password') donde lo necesite para comparar el hash
  password: { type: String, required: true, select: false },
  rol: { type: String, enum: ROLES, default: 'cliente' },
  fechaRegistro: { type: Date, default: Date.now },
  autorizacionDatos: { type: autorizacionSchema, required: false },
})

// asi ningun endpoint puede filtrar el hash sin querer, ni acordandose de hacer .select('-password')
usuarioSchema.set('toJSON', {
  transform(_doc, ret) {
    delete (ret as Partial<IUsuario>).password
    // es prueba del taller, no dato de sesión: el cliente no lo necesita
    delete (ret as Partial<IUsuario>).autorizacionDatos
    return ret
  },
})

export const Usuario = model<IUsuario>('Usuario', usuarioSchema)
