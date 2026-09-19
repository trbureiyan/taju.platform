import type { Request, Response, NextFunction } from 'express'
import type { Rol } from '../types/index.js'

// factory en vez de middleware fijo: cada ruta declara con quien puede entrar, ej requireRol('administrador')
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
