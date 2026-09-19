import { Router } from 'express'
import * as catalogController from './catalog.controller.js'
import { requireAuth } from '../../middleware/auth.js'
import { requireRol } from '../../middleware/rbac.js'

const router = Router()

// lectura publica - cualquiera navega el catalogo sin cuenta, escritura solo para admin
router.get('/', catalogController.listarProductos)
router.get('/:id', catalogController.obtenerProducto)
router.post('/', requireAuth, requireRol('administrador'), catalogController.crearProducto)
router.patch('/:id', requireAuth, requireRol('administrador'), catalogController.actualizarProducto)

export default router
