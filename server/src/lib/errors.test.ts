import { describe, it, expect, vi } from 'vitest'
import type { Request, Response, NextFunction } from 'express'
import mongoose from 'mongoose'
import { AppError, errorHandler } from './errors.js'

// construye un mock mínimo de req/res/next para llamar errorHandler directamente
function buildMocks() {
  const json = vi.fn()
  const status = vi.fn().mockReturnValue({ json })
  const res = { status, json } as unknown as Response
  const req = {} as Request
  const next = vi.fn() as unknown as NextFunction
  return { req, res, next, status, json }
}

describe('errorHandler', () => {
  it('retorna el status y mensaje de AppError', () => {
    const { req, res, next, status, json } = buildMocks()
    errorHandler(new AppError(422, 'Dato inválido'), req, res, next)
    expect(status).toHaveBeenCalledWith(422)
    expect(json).toHaveBeenCalledWith({ error: 'Dato inválido' })
  })

  it('retorna 404 para CastError de Mongoose en _id', () => {
    const { req, res, next, status, json } = buildMocks()
    const castError = new mongoose.Error.CastError('ObjectId', 'id-invalido', '_id')
    errorHandler(castError, req, res, next)
    expect(status).toHaveBeenCalledWith(404)
    expect(json).toHaveBeenCalledWith({ error: 'Recurso no encontrado' })
  })

  it('no convierte en 404 un CastError en un campo distinto a _id', () => {
    const { req, res, next, status } = buildMocks()
    const castError = new mongoose.Error.CastError('ObjectId', 'id-invalido', 'cliente')
    errorHandler(castError, req, res, next)
    // cae al handler generico de 500
    expect(status).toHaveBeenCalledWith(500)
  })

  it('retorna 500 generico para errores desconocidos', () => {
    const { req, res, next, status, json } = buildMocks()
    errorHandler(new Error('algo explotó'), req, res, next)
    expect(status).toHaveBeenCalledWith(500)
    expect(json).toHaveBeenCalledWith({ error: 'Error interno del servidor' })
  })
})
