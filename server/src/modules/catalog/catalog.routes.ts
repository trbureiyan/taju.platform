import { Router } from 'express'
import * as catalogController from './catalog.controller.js'
import { attachUsuarioOpcional, requireAuth } from '../../middleware/auth.js'
import { requireRol } from '../../middleware/rbac.js'

const router = Router()

// lectura publica - cualquiera navega el catalogo sin cuenta; con sesion admin ve inactivos tambien
router.get('/', attachUsuarioOpcional, catalogController.listarProductos)
router.get('/:id', attachUsuarioOpcional, catalogController.obtenerProducto)
router.post('/', requireAuth, requireRol('administrador'), catalogController.crearProducto)
router.patch('/:id', requireAuth, requireRol('administrador'), catalogController.actualizarProducto)
router.delete('/:id', requireAuth, requireRol('administrador'), catalogController.eliminarProducto)

export default router
