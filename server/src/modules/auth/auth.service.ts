import bcrypt from 'bcryptjs'
import { Usuario } from '../../models/Usuario.js'
import { signToken } from '../../lib/jwt.js'

// 12 es el estandar actual para bcrypt, suficiente costo sin volver el login lento
const SALT_ROUNDS = 12

// ─── Registro ─────────────────────────────────────────────────────────────────

export async function registrar(email: string, password: string) {
  const existe = await Usuario.findOne({ email })
  if (existe) throw new Error('El correo ya está registrado')

  const hash = await bcrypt.hash(password, SALT_ROUNDS)
  const usuario = await Usuario.create({ email, password: hash })

  // se loguea automatico al registrarse, no hay paso intermedio de "verificar correo"
  const token = signToken({ sub: usuario.id, email: usuario.email, rol: usuario.rol })
  return { token, usuario: { _id: usuario.id, email: usuario.email, rol: usuario.rol } }
}

// ─── Login ────────────────────────────────────────────────────────────────────

export async function iniciarSesion(email: string, password: string) {
  const usuario = await Usuario.findOne({ email })
  // mismo mensaje si el correo no existe o si la clave esta mal, no le decimos a nadie cual campo fallo
  if (!usuario) throw new Error('Credenciales incorrectas')

  const valida = await bcrypt.compare(password, usuario.password)
  if (!valida) throw new Error('Credenciales incorrectas')

  const token = signToken({ sub: usuario.id, email: usuario.email, rol: usuario.rol })
  return { token, usuario: { _id: usuario.id, email: usuario.email, rol: usuario.rol } }
}
