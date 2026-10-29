import type { RequestHandler } from 'express'

interface OpcionesLimite {
  max?: number
  skip?: () => boolean
}

/**
 * Limita cuántas peticiones con fotos se procesan a la vez.
 * [DECISION] tope global y no por usuario - multer guarda cada archivo en memoria, y en Render gratuito (512 MB) lo que
 * se acota es la memoria del proceso: 4 peticiones x 3 fotos x 5 MB = 60 MB en el peor caso. El limitador por IP de
 * pedidos.routes.ts frena abuso en el tiempo; este frena la concurrencia.
 * @param opciones - `max` de peticiones en curso (4 por defecto) y `skip` para saltar el limite (en test por defecto).
 * @returns Middleware que responde 503 con Retry-After cuando ya hay `max` en curso. El cupo se libera al terminar la
 *          respuesta o al cortarse la conexion.
 */
export function limitarSubidasEnCurso({ max = 4, skip = () => process.env.NODE_ENV === 'test' }: OpcionesLimite = {}): RequestHandler {
  let enCurso = 0

  return (_req, res, next) => {
    if (skip()) return next()
    if (enCurso >= max) {
      res.setHeader('Retry-After', '60')
      res.status(503).json({ error: 'El taller está recibiendo muchas fotos a la vez. Intenta de nuevo en un minuto.' })
      return
    }

    enCurso += 1
    let liberado = false
    const liberar = () => {
      if (liberado) return
      liberado = true
      enCurso -= 1
    }
    // finish: respuesta enviada; close: el cliente corto antes de recibirla. Cualquiera de los dos libera, una sola vez
    res.once('finish', liberar)
    res.once('close', liberar)
    next()
  }
}
