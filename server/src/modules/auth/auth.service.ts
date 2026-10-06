import bcrypt from 'bcryptjs'
import { Usuario } from '../../models/Usuario.js'
import { signToken } from '../../lib/jwt.js'
import { AppError } from '../../lib/errors.js'

// 12 es el estandar actual para bcrypt, suficiente costo sin volver el login lento
const SALT_ROUNDS = 12

// versión del texto de /datos que el cliente mostró al aceptar; subirla (y la espejada en client/src/lib/politicaDatos.ts)
// cuando el texto cambie de fondo
export const VERSION_POLITICA_DATOS = '2026-10-06'

// ─── Registro ─────────────────────────────────────────────────────────────────

/**
 * Registra un nuevo usuario y lo autentica de inmediato.
 * @param nombre - Nombre visible del usuario.
 * @param email - Correo único; lanza AppError(409) si ya está registrado.
 * @param password - Contraseña en texto plano; se hashea con bcrypt antes de persistir.
 * @param aceptaDatos - Autorización de tratamiento de datos; el tipo literal obliga al llamador a haberla validado.
 *        El servidor sella versión y fecha, nunca las toma del cliente.
 * @returns Token JWT y datos públicos del usuario recién creado.
 * @throws AppError(409) si el correo ya existe (findOne previo o race condition E11000).
 * @throws AppError(400) si aceptaDatos no es true (defensa en profundidad, el controlador ya lo valida).
 */
export async function registrar(nombre: string, email: string, password: string, aceptaDatos: true) {
  if (!aceptaDatos) throw new AppError(400, 'Datos inválidos')
  const existe = await Usuario.findOne({ email })
  if (existe) throw new AppError(409, 'El correo ya está registrado')

  const hash = await bcrypt.hash(password, SALT_ROUNDS)
  let usuario
  try {
    usuario = await Usuario.create({
      nombre,
      email,
      password: hash,
      autorizacionDatos: { version: VERSION_POLITICA_DATOS, aceptadaEn: new Date() },
    })
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

// hash ficticio de "placeholder" (bcrypt, 12 rondas) — se usa cuando el email no existe para que
// bcrypt.compare tarde lo mismo en ambas ramas y no haya diferencia de tiempo que permita enumerar emails
const HASH_FICTICIO = '$2b$12$Gz.eleFiOKys0PbvYxnkFOJ1EZ.dJf5NJs2.K53ANvhw6Dfx58TfS'

/**
 * Autentica a un usuario existente.
 * @param email - Correo registrado.
 * @param password - Contraseña en texto plano a comparar con el hash almacenado.
 * @returns Token JWT y datos públicos del usuario.
 * @throws AppError(401) con mensaje genérico tanto si el correo no existe como si la clave es incorrecta,
 *         para no revelar cuál campo falló ni dar información de timing sobre si el email existe.
 */
export async function iniciarSesion(email: string, password: string) {
  // +password: el campo es select:false por defecto (ver Usuario.ts)
  const usuario = await Usuario.findOne({ email }).select('+password')

  // siempre comparar contra un hash para igualar el tiempo de respuesta:
  // sin esto, la ausencia del usuario retorna en ~5ms y la clave incorrecta en ~150ms (bcrypt cost 12),
  // lo que delata si el email existe o no sin importar que el mensaje de error sea identico
  const hashAComparar = usuario?.password ?? HASH_FICTICIO
  const valida = await bcrypt.compare(password, hashAComparar)

  // mismo mensaje en los tres casos: email no existe, hash ficticio, clave incorrecta
  if (!usuario || !valida) throw new AppError(401, 'Credenciales incorrectas')

  const token = signToken({ sub: usuario.id, email: usuario.email, rol: usuario.rol })
  return { token, usuario: { _id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol } }
}
