import jwt from 'jsonwebtoken'
import type { JwtPayload } from '../types/index.js'

// lee el secreto en cada llamada en vez de cachearlo en modulo - falla rapido si falta el env en vez
// de arrancar el server "bien" y explotar recien en el primer login
function secret(): string {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('JWT_SECRET no definida')
  return s
}

// 8h cubre un turno de trabajo del taller sin forzar re-login a media tarde
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, secret(), { expiresIn: '8h' })
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, secret()) as JwtPayload
}
