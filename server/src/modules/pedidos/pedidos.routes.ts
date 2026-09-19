import { Router } from 'express'
import { requireAuth } from '../../middleware/auth.js'
import { requireRol } from '../../middleware/rbac.js'
import { uploadImagen } from '../../middleware/upload.js'
import * as pedidosController from './pedidos.controller.js'

const router = Router()

// todo requiere sesion - a diferencia del catalogo, ver pedidos siempre exige estar logueado
router.get('/', requireAuth, requireRol('administrador'), pedidosController.getAllPedidos)
router.post('/', requireAuth, uploadImagen, pedidosController.crearPedido)

// '/mis-pedidos' va antes de '/:id' o express la confundiria con un id de pedido
router.get('/mis-pedidos', requireAuth, pedidosController.getMisPedidos)

router.patch('/:id/estado', requireAuth, requireRol('administrador'), pedidosController.actualizarEstado)
router.patch('/:id/fecha-entrega', requireAuth, requireRol('administrador'), pedidosController.setFechaEntrega)
router.get('/:id', requireAuth, pedidosController.getPedidoById)

export default router
