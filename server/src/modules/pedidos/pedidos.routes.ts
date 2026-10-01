import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { requireAuth } from '../../middleware/auth.js'
import { requireRol } from '../../middleware/rbac.js'
import { uploadImagen } from '../../middleware/upload.js'
import * as pedidosController from './pedidos.controller.js'

// 100 por IP en 15 min: sobra para un taller con una sola conexion y frena un script o una cuenta robada.
// definido en este archivo y no en un modulo aparte, igual que en auth.routes.ts, para que el analisis estatico lo vea
interface OpcionesLimite {
  max?: number
  skip?: () => boolean
}

/**
 * Router de pedidos. Las opciones existen para que los tests lo armen con el limite encendido y bajo.
 * @param opciones - `max` de peticiones por ventana y `skip` para saltar el limite.
 * @returns Router con `limitePedidos` en todas sus rutas, antes de la autenticacion.
 */
export function crearPedidosRouter({ max = 100, skip = () => process.env.NODE_ENV === 'test' }: OpcionesLimite = {}) {
  const limitePedidos = rateLimit({
    windowMs: 15 * 60 * 1000,
    max,
    standardHeaders: false,
    legacyHeaders: false,
    // en tests de integracion se salta para no contaminar requests; pedidos.routes.test.ts lo enciende
    skip,
    message: { error: 'Recibimos muchas solicitudes seguidas desde tu conexión. Espera unos minutos y vuelve a intentarlo.' },
  })

  const router = Router()

  // todo requiere sesion - a diferencia del catalogo, ver pedidos siempre exige estar logueado
  router.get('/', limitePedidos, requireAuth, requireRol('administrador'), pedidosController.getAllPedidos)
  router.post('/', limitePedidos, requireAuth, uploadImagen, pedidosController.crearPedido)

  // '/mis-pedidos' va antes de '/:id' o express la confundiria con un id de pedido
  router.get('/mis-pedidos', limitePedidos, requireAuth, pedidosController.getMisPedidos)

  router.patch('/:id/estado', limitePedidos, requireAuth, requireRol('administrador'), pedidosController.actualizarEstado)
  router.post('/:id/contacto', limitePedidos, requireAuth, requireRol('administrador'), pedidosController.marcarContactado)
  router.patch('/:id/acuerdo', limitePedidos, requireAuth, requireRol('administrador'), pedidosController.registrarAcuerdo)
  router.patch('/:id/cancelar', limitePedidos, requireAuth, pedidosController.cancelarMiPedido)
  router.get('/:id', limitePedidos, requireAuth, pedidosController.getPedidoById)

  return router
}

const routerPedidos = crearPedidosRouter()

export default routerPedidos
