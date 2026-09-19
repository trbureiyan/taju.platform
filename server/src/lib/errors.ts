import type { NextFunction, Request, RequestHandler, Response } from 'express'

// error de negocio esperado (correo duplicado, credenciales invalidas, etc) - lleva su propio status HTTP.
// cualquier otra excepcion (Mongo caido, bcrypt fallando, JWT_SECRET ausente) no es un AppError y cae al 500
export class AppError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// Express 4 no propaga rechazos de handlers async al middleware de errores - este wrapper lo hace explicito
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next)
  }
}

// ultimo middleware de la cadena: AppError expone su mensaje, todo lo demas se loguea y responde generico
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.message })
    return
  }
  console.error('Error no manejado:', err)
  res.status(500).json({ error: 'Error interno del servidor' })
}
