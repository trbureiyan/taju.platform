import type { NextFunction, Request, RequestHandler, Response } from 'express'
import mongoose from 'mongoose'

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

  // CastError de Mongoose en _id: el parámetro de ruta no era un ObjectId válido
  // retornar 404 en vez de 500 — el recurso no existe desde la perspectiva del cliente
  // solo aplica cuando err.path === '_id' para no convertir otros CastErrors en 404
  if (err instanceof mongoose.Error.CastError && err.path === '_id') {
    res.status(404).json({ error: 'Recurso no encontrado' })
    return
  }

  // otro cambio sobre el mismo documento se guardo entre la lectura y el save (optimisticConcurrency)
  if (err instanceof mongoose.Error.VersionError) {
    res.status(409).json({
      error: 'Este pedido cambió hace un momento y no alcanzamos a guardar tu cambio. Recarga la página y vuelve a intentarlo.',
    })
    return
  }

  // errores HTTP de Express/body-parser (PayloadTooLargeError, SyntaxError de JSON malformado, etc.)
  // traen un campo .status numerico que es el codigo HTTP correcto a propagar
  if (
    typeof err === 'object' &&
    err !== null &&
    'status' in err &&
    typeof (err as { status: unknown }).status === 'number'
  ) {
    const status = (err as { status: number }).status
    if (status >= 400 && status < 500) {
      res.status(status).json({ error: 'Solicitud inválida' })
      return
    }
  }

  console.error('Error no manejado:', err)
  res.status(500).json({ error: 'Error interno del servidor' })
}
