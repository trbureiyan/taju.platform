import { Router } from 'express'
import * as authController from '../modules/auth/auth.controller.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// registrar y login son publicas por definicion, solo /me exige sesion activa
router.post('/registrar', authController.registrar)
router.post('/login', authController.login)
router.get('/me', requireAuth, authController.me) // para que el front confirme sesion al recargar

export default router
