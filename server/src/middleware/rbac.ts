import type { Request, Response, NextFunction } from 'express'
import type { Rol } from '../types/index.js'

/**
 * Factory de middleware que valida si el usuario tiene uno de los roles permitidos.
 * Requiere que requireAuth se haya ejecutado antes en la cadena.
 * @param roles - Lista de roles autorizados.
 * @returns Middleware que retorna 403 si el rol no coincide.
 */
export function requireRol(...roles: Rol[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // requiere requireAuth antes en la cadena - si no hay req.usuario, nunca hubo sesion valida
    if (!req.usuario || !roles.includes(req.usuario.rol)) {
      res.status(403).json({ error: 'Sin permiso para esta operación' })
      return
    }
    next()
  }
}
