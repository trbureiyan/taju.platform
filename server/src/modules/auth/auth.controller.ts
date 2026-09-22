import type { NextFunction, Request, Response } from 'express'
import { z } from 'zod'
import * as authService from './auth.service.js'
import { AppError } from '../../lib/errors.js'

// min(8) en registro, min(1) en login - login no valida fuerza de clave, solo que venga algo
const registrarSchema = z.object({
  nombre: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

// zod valida forma; el service lanza AppError para reglas de negocio (correo repetido).
// cualquier otra excepcion (Mongo caido, bcrypt, JWT_SECRET ausente) se delega a errorHandler via next
/**
 * Maneja el registro de un nuevo usuario.
 * @returns { token, usuario } con status 201.
 */
export async function registrar(req: Request, res: Response, next: NextFunction): Promise<void> {
  const parsed = registrarSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', detalle: z.flattenError(parsed.error) })
    return
  }
  try {
    const result = await authService.registrar(parsed.data.nombre, parsed.data.email, parsed.data.password)
    res.status(201).json(result)
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.status).json({ error: err.message })
      return
    }
    next(err)
  }
}

/**
 * Maneja el inicio de sesión de un usuario existente.
 * @returns { token, usuario } con status 200.
 */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos' })
    return
  }
  try {
    const result = await authService.iniciarSesion(parsed.data.email, parsed.data.password)
    res.json(result)
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.status).json({ error: err.message })
      return
    }
    next(err)
  }
}

/**
 * Retorna los datos del usuario autenticado a partir de su token JWT.
 */
export function me(req: Request, res: Response): void {
  res.json({ usuario: req.usuario })
}
