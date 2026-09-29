import rateLimit from 'express-rate-limit'

interface OpcionesLimite {
  max?: number
  skip?: () => boolean
}

/**
 * Limitador para las rutas de pedidos que cambian estado o datos.
 * @param opciones - `max` de peticiones por ventana de 15 min (100 por defecto) y `skip` opcional;
 *        por defecto se salta en NODE_ENV=test para no contaminar los tests de integracion.
 */
export function crearLimitePedidos({ max = 100, skip = () => process.env.NODE_ENV === 'test' }: OpcionesLimite = {}) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max,
    standardHeaders: false,
    legacyHeaders: false,
    skip,
    // 100 por IP en 15 min: sobra para un taller con una sola conexion y frena un script o una cuenta robada
    message: { error: 'Recibimos muchas solicitudes seguidas desde tu conexión. Espera unos minutos y vuelve a intentarlo.' },
  })
}

export const limitePedidos = crearLimitePedidos()
