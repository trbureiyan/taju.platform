import { Router } from 'express'
import authRoutes from '../modules/auth/auth.routes.js'
import catalogRoutes from '../modules/catalog/catalog.routes.js'
import categoriasRoutes from '../modules/catalog/categorias.routes.js'
import pedidosRoutes from '../modules/pedidos/pedidos.routes.js'

const router = Router()

// se monta bajo /api en index.ts - cada modulo resuelve sus propios permisos internamente
router.use('/auth', authRoutes)
router.use('/categorias', categoriasRoutes)
router.use('/productos', catalogRoutes)
router.use('/pedidos', pedidosRoutes)

export default router
