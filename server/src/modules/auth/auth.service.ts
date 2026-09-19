import bcrypt from 'bcryptjs'
import { Usuario } from '../../models/Usuario.js'
import { signToken } from '../../lib/jwt.js'
import { AppError } from '../../lib/errors.js'

// 12 es el estandar actual para bcrypt, suficiente costo sin volver el login lento
const SALT_ROUNDS = 12

// ─── Registro ─────────────────────────────────────────────────────────────────

/**
 * Registra un nuevo usuario y lo autentica de inmediato.
 * @param nombre - Nombre visible del usuario.
 * @param email - Correo único; lanza AppError(409) si ya está registrado.
 * @param password - Contraseña en texto plano; se hashea con bcrypt antes de persistir.
 * @returns Token JWT y datos públicos del usuario recién creado.
 * @throws AppError(409) si el correo ya existe (findOne previo o race condition E11000).
 */
export async function registrar(nombre: string, email: string, password: string) {
  const existe = await Usuario.findOne({ email })
  if (existe) throw new AppError(409, 'El correo ya está registrado')

  const hash = await bcrypt.hash(password, SALT_ROUNDS)
  let usuario
  try {
    usuario = await Usuario.create({ nombre, email, password: hash })
  } catch (err: unknown) {
    // race condition: dos requests simultáneos pasaron el findOne antes de que alguno insertara
    // MongoDB lanza code 11000 (duplicate key) por el índice único en email
    if (typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000) {
      throw new AppError(409, 'El correo ya está registrado')
    }
    throw err
  }

  // se loguea automatico al registrarse, no hay paso intermedio de "verificar correo"
  const token = signToken({ sub: usuario.id, email: usuario.email, rol: usuario.rol })
  return { token, usuario: { _id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol } }
}

// ─── Login ────────────────────────────────────────────────────────────────────

/**
 * Autentica a un usuario existente.
 * @param email - Correo registrado.
 * @param password - Contraseña en texto plano a comparar con el hash almacenado.
 * @returns Token JWT y datos públicos del usuario.
 * @throws AppError(401) con mensaje genérico tanto si el correo no existe como si la clave es incorrecta,
 *         para no revelar cuál campo falló.
 */
export async function iniciarSesion(email: string, password: string) {
  // +password: el campo es select:false por defecto (ver Usuario.ts)
  const usuario = await Usuario.findOne({ email }).select('+password')
  // mismo mensaje si el correo no existe o si la clave esta mal, no le decimos a nadie cual campo fallo
  if (!usuario) throw new AppError(401, 'Credenciales incorrectas')

  const valida = await bcrypt.compare(password, usuario.password)
  if (!valida) throw new AppError(401, 'Credenciales incorrectas')

  const token = signToken({ sub: usuario.id, email: usuario.email, rol: usuario.rol })
  return { token, usuario: { _id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol } }
}
