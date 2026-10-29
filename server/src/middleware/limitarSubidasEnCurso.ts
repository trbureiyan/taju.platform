import type { RequestHandler } from 'express'

interface OpcionesLimite {
  max?: number
  maxPorUsuario?: number
  inactividadMs?: number
  skip?: () => boolean
}

/**
 * Limita cuántas peticiones con fotos se procesan a la vez, en total y por cuenta, y corta las que dejan de enviar bytes.
 * [DECISION] tope global y ademas por cuenta - multer guarda cada archivo en memoria y en Render gratuito (512 MB) lo que se
 * acota es la memoria del proceso: 4 peticiones x 3 fotos x 5 MB = 60 MB en el peor caso. Solo con el tope global, una
 * cuenta con subidas a gotas podria ocupar los 4 cupos y dejar fuera a todos; por cuenta (1) necesita 4 cuentas.
 * El limitador por IP de pedidos.routes.ts frena abuso en el tiempo; este frena la concurrencia.
 * @param opciones - `max` en total (4), `maxPorUsuario` (1), `inactividadMs` sin recibir bytes antes de cortar (20 s)
 *                   y `skip` para saltar el limite (en test por defecto).
 * @returns Middleware: 503 con Retry-After si ya hay `max` en curso, 429 si la cuenta ya tiene `maxPorUsuario`. El cupo se
 *          libera al terminar la respuesta o al cortarse la conexion. Va despues de requireAuth.
 */
export function limitarSubidasEnCurso({
  max = 4,
  maxPorUsuario = 1,
  inactividadMs = 20_000,
  skip = () => process.env.NODE_ENV === 'test',
}: OpcionesLimite = {}): RequestHandler {
  let enCurso = 0
  const porUsuario = new Map<string, number>()

  return (req, res, next) => {
    if (skip()) return next()

    const usuario = req.usuario?.sub
    if (usuario && (porUsuario.get(usuario) ?? 0) >= maxPorUsuario) {
      res.setHeader('Retry-After', '10')
      res.status(429).json({ error: 'Ya estamos recibiendo las fotos de tu pedido. Espera unos segundos antes de volver a enviarlo.' })
      return
    }
    if (enCurso >= max) {
      res.setHeader('Retry-After', '60')
      res.status(503).json({ error: 'El taller está recibiendo muchas fotos a la vez. Intenta de nuevo en un minuto.' })
      return
    }

    enCurso += 1
    if (usuario) porUsuario.set(usuario, (porUsuario.get(usuario) ?? 0) + 1)

    // sin bytes nuevos entre dos revisiones el cliente esta estancado: se corta para no retener el cupo hasta el timeout total.
    // Se mira socket.bytesRead y no req.on('data'): enganchar 'data' aqui pondria el stream en modo fluido antes de que multer lo lea
    let leidos = req.socket.bytesRead
    const vigilante = setInterval(() => {
      if (req.complete) return clearInterval(vigilante)
      if (req.socket.bytesRead === leidos) return void req.destroy()
      leidos = req.socket.bytesRead
    }, inactividadMs / 2)
    vigilante.unref()

    let liberado = false
    const liberar = () => {
      if (liberado) return
      liberado = true
      clearInterval(vigilante)
      enCurso -= 1
      if (usuario) {
        const restantes = (porUsuario.get(usuario) ?? 1) - 1
        if (restantes <= 0) porUsuario.delete(usuario)
        else porUsuario.set(usuario, restantes)
      }
    }
    // finish: respuesta enviada; close: el cliente corto antes de recibirla. Cualquiera de los dos libera, una sola vez
    res.once('finish', liberar)
    res.once('close', liberar)
    next()
  }
}
