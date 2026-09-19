import { Router } from 'express'
import authRoutes from '../modules/auth/auth.routes.js'

// router raiz montado bajo /api en index.ts - los modulos de dominio se registran aqui a medida que existan
const router = Router()

router.use('/auth', authRoutes)

export default router
