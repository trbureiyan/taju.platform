import { Router } from 'express'
import * as catalogController from './catalog.controller.js'
import { attachUsuarioOpcional, requireAuth } from '../../middleware/auth.js'
import { requireRol } from '../../middleware/rbac.js'

const router = Router()

// mismo patron de permisos que catalog.routes.ts: lectura abierta (admin ve inactivas), escritura solo admin
router.get('/', attachUsuarioOpcional, catalogController.listarCategorias)
router.get('/:id', attachUsuarioOpcional, catalogController.obtenerCategoria)
router.post('/', requireAuth, requireRol('administrador'), catalogController.crearCategoria)
router.patch('/:id', requireAuth, requireRol('administrador'), catalogController.actualizarCategoria)

export default router
