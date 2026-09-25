import { describe, it, expect, vi } from 'vitest'
import type { Request, Response, NextFunction } from 'express'
import { requireRol } from './rbac.js'
import type { JwtPayload } from '../types/index.js'

function crearRes() {
  const res = { status: vi.fn(), json: vi.fn() }
  res.status.mockReturnValue(res)
  return res
}

function ejecutar(usuario: JwtPayload | undefined, ...roles: Parameters<typeof requireRol>) {
  const req = { usuario } as Request
  const res = crearRes()
  const next = vi.fn() as unknown as NextFunction
  requireRol(...roles)(req, res as unknown as Response, next)
  return { res, next }
}

const cliente: JwtPayload = { sub: 'u1', email: 'cliente@taju.co', rol: 'cliente' }
const admin: JwtPayload = { sub: 'u2', email: 'admin@taju.co', rol: 'administrador' }

describe('requireRol', () => {
  it('deja pasar cuando el rol está en la lista', () => {
    const { res, next } = ejecutar(admin, 'administrador')
    expect(next).toHaveBeenCalledOnce()
    expect(res.status).not.toHaveBeenCalled()
  })

  it('acepta cualquiera de varios roles permitidos', () => {
    const { next } = ejecutar(cliente, 'administrador', 'cliente')
    expect(next).toHaveBeenCalledOnce()
  })

  it('responde 403 cuando el rol no está en la lista', () => {
    const { res, next } = ejecutar(cliente, 'administrador')
    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ error: expect.any(String) })
  })

  // requireAuth no corrio o fallo: sin usuario nunca se habilita la ruta, aunque la lista este vacia
  it('responde 403 sin req.usuario', () => {
    const { res, next } = ejecutar(undefined, 'cliente')
    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(403)
  })
})
