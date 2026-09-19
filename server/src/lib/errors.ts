import type { NextFunction, Request, RequestHandler, Response } from 'express'

/**
 * Error de negocio con estado HTTP específico. Atrapado por errorHandler para
 * devolver el mensaje al cliente.
 */
export class AppError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

/**
 * Wrapper para rutas asíncronas de Express. Atrapa promesas rechazadas
 * y las pasa a next() automáticamente.
 */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next)
  }
}

/**
 * Middleware central de manejo de errores.
 * Errores AppError envían su mensaje al cliente. Otros errores retornan 500 genérico.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.message })
    return
  }
  console.error('Error no manejado:', err)
  res.status(500).json({ error: 'Error interno del servidor' })
}
