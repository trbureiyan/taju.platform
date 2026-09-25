import { describe, it, expect, vi } from 'vitest'
import jwt from 'jsonwebtoken'
import { signToken, verifyToken } from './jwt.js'
import type { JwtPayload } from '../types/index.js'

// JWT_SECRET fijo lo pone vitest.config.mts, igual que en el resto de la suite del server
const payload: JwtPayload = { sub: 'user-1', email: 'ana@taju.co', rol: 'cliente' }

describe('signToken / verifyToken', () => {
  it('firma un token que verifyToken decodifica con el mismo payload', () => {
    const token = signToken(payload)
    expect(verifyToken(token)).toMatchObject(payload)
  })

  it('rechaza un token firmado con otro secreto', () => {
    const token = jwt.sign(payload, 'otro-secreto-distinto', { expiresIn: '8h' })
    expect(() => verifyToken(token)).toThrow()
  })

  it('rechaza un token con firma valida pero payload incompleto', () => {
    // firmado con el mismo secreto que usa la app, pero sin email ni rol
    const token = jwt.sign({ sub: 'user-1' }, process.env.JWT_SECRET!, { expiresIn: '8h' })
    expect(() => verifyToken(token)).toThrow('Token con payload invalido')
  })

  // signToken fija 8h a proposito (ver jwt.ts) - pasado ese margen el token debe dejar de servir
  it('rechaza un token pasadas las 8 horas de expiracion', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    try {
      const token = signToken(payload)
      vi.advanceTimersByTime(8 * 60 * 60 * 1000 + 1_000)
      expect(() => verifyToken(token)).toThrow()
    } finally {
      vi.useRealTimers()
    }
  })

  it('acepta un token todavia dentro de la ventana de 8 horas', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    try {
      const token = signToken(payload)
      vi.advanceTimersByTime(7 * 60 * 60 * 1000)
      expect(verifyToken(token)).toMatchObject(payload)
    } finally {
      vi.useRealTimers()
    }
  })
})
