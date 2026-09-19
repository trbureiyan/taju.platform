import type { Request, Response } from 'express'
import { z } from 'zod'
import * as authService from './auth.service.js'

// min(8) en registro, min(1) en login - login no valida fuerza de clave, solo que venga algo
const registrarSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

// zod valida forma, el service valida reglas de negocio (correo repetido) - por eso el try/catch separado
export async function registrar(req: Request, res: Response): Promise<void> {
  const parsed = registrarSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', detalle: parsed.error.flatten() })
    return
  }
  try {
    const result = await authService.registrar(parsed.data.email, parsed.data.password)
    res.status(201).json(result)
  } catch (err) {
    // 409 y no 400: la forma de los datos esta bien, el conflicto es que el correo ya existe
    const message = err instanceof Error ? err.message : 'Error al registrar'
    res.status(409).json({ error: message })
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos' })
    return
  }
  try {
    const result = await authService.iniciarSesion(parsed.data.email, parsed.data.password)
    res.json(result)
  } catch {
    res.status(401).json({ error: 'Credenciales incorrectas' })
  }
}

// req.usuario ya viene decodificado del token por requireAuth, aqui no se toca la db
export function me(req: Request, res: Response): void {
  res.json({ usuario: req.usuario })
}
