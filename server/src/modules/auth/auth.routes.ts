import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import * as authController from './auth.controller.js'
import { requireAuth } from '../../middleware/auth.js'

// 10 intentos por ventana de 15 min — suficiente para un uso legítimo, costoso para fuerza bruta
const limiteAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  // en tests el limiter se salta para no contaminar requests entre tests de integración;
  // los tests de comportamiento del limiter usan su propia mini-app (auth.routes.test.ts)
  skip: () => process.env.NODE_ENV === 'test',
  message: { error: 'Demasiados intentos. Esperá unos minutos antes de volver a intentarlo.' },
})

const router = Router()

// registrar y login son publicas por definicion, solo /me exige sesion activa
router.post('/registrar', limiteAuth, authController.registrar)
router.post('/login', limiteAuth, authController.login)
router.get('/me', requireAuth, authController.me) // para que el front confirme sesion al recargar

export default router
