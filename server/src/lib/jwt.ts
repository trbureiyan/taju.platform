import jwt from 'jsonwebtoken'
import { ROLES, type JwtPayload } from '../types/index.js'

// lee el secreto en cada llamada en vez de cachearlo en modulo - falla rapido si falta el env en vez
// de arrancar el server "bien" y explotar recien en el primer login
function secret(): string {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('JWT_SECRET no definida')
  return s
}

// 8h cubre un turno de trabajo del taller sin forzar re-login a media tarde
/**
 * Firma un nuevo token JWT válido por 8 horas.
 * @param payload - Datos públicos a codificar.
 * @returns Cadena JWT firmada.
 */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, secret(), { expiresIn: '8h' })
}

// jwt.verify solo garantiza la firma, no la forma del payload - un token viejo o
// firmado por otro flujo podria no traer sub/email/rol validos
function esJwtPayload(payload: unknown): payload is JwtPayload {
  if (typeof payload !== 'object' || payload === null) return false
  const p = payload as Record<string, unknown>
  return (
    typeof p.sub === 'string' &&
    typeof p.email === 'string' &&
    ROLES.includes(p.rol as (typeof ROLES)[number])
  )
}

/**
 * Verifica la firma y estructura del token JWT.
 * @param token - Token a verificar.
 * @returns Payload estructurado garantizado.
 * @throws Error si el token es inválido, expiró, o el payload no cumple JwtPayload.
 */
export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, secret())
  if (!esJwtPayload(decoded)) throw new Error('Token con payload invalido')
  return decoded
}
