import type { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../lib/jwt.js'
import type { JwtPayload } from '../types/index.js'

// augmentamos Request para colgar el payload decodificado y no andar castings por todo el codigo
declare global {
  namespace Express {
    interface Request {
      usuario?: JwtPayload
    }
  }
}

// para lecturas publicas que quieren dar mas informacion si hay sesion admin (ver catalog) sin exigir login -
// token ausente o invalido simplemente no puebla req.usuario, nunca corta la request
/**
 * Extrae y valida el token JWT si está presente en el header Authorization, poblando req.usuario.
 * Si no hay token o es inválido, ignora silenciosamente y permite continuar la request (para endpoints públicos).
 */
export function attachUsuarioOpcional(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) {
    try {
      req.usuario = verifyToken(header.slice(7))
    } catch {
      // token invalido en un endpoint publico no es un error del cliente - se ignora y sigue como anonimo
    }
  }
  next()
}

/**
 * Exige un token JWT válido. Pobla req.usuario si el token es legítimo.
 * Retorna 401 si falta o es inválido. No valida rol (eso lo hace rbac.ts).
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No autenticado' })
    return
  }

  const token = header.slice(7) // corta el prefijo "Bearer "
  try {
    req.usuario = verifyToken(token)
    next()
  } catch {
    // token vencido, manipulado, o firmado con otro secret - mismo mensaje generico en los tres casos
    res.status(401).json({ error: 'Token inválido o expirado' })
  }
}
