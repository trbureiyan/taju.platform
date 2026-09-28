import { describe, it, expect } from 'vitest'
import express from 'express'
import request from 'supertest'
import rateLimit from 'express-rate-limit'

// mini-app sin MongoDB — verifica el comportamiento del limiter en aislamiento
function crearAppConLimiter(max: number) {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiados intentos. Esperá unos minutos antes de volver a intentarlo.' },
  })
  const app = express()
  app.use(express.json())
  app.post('/login', limiter, (_req, res) => { res.json({ ok: true }) })
  return app
}

describe('rate limiting — auth routes', () => {
  it('permite hasta el límite configurado de intentos', async () => {
    const app = crearAppConLimiter(3)
    for (let i = 0; i < 3; i++) {
      const res = await request(app)
        .post('/login')
        .set('X-Forwarded-For', '10.0.0.1')
        .send({})
      expect(res.status).toBe(200)
    }
  })

  it('bloquea con 429 al superar el límite', async () => {
    const app = crearAppConLimiter(3)
    // agotar el límite
    for (let i = 0; i < 3; i++) {
      await request(app).post('/login').set('X-Forwarded-For', '10.0.0.2').send({})
    }
    // el siguiente debe ser rechazado
    const res = await request(app)
      .post('/login')
      .set('X-Forwarded-For', '10.0.0.2')
      .send({})
    expect(res.status).toBe(429)
    expect(res.body.error).toMatch(/Demasiados intentos/)
  })

  it('la cabecera RateLimit-Limit refleja el máximo configurado', async () => {
    const app = crearAppConLimiter(10)
    const res = await request(app)
      .post('/login')
      .set('X-Forwarded-For', '10.0.0.3')
      .send({})
    expect(res.headers['ratelimit-limit']).toBe('10')
  })
})
