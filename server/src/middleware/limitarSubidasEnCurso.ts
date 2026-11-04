import type { RequestHandler } from 'express'

interface OpcionesLimite {
  max?: number
  maxPorUsuario?: number
  inactividadMs?: number
  minBytesPorRevision?: number
  plazoSubidaMs?: number
  skip?: () => boolean
}

/**
 * Limita cuántas peticiones con fotos se procesan a la vez, en total y por cuenta, y corta las que dejan de enviar bytes.
 * [DECISION] tope global y ademas por cuenta - multer guarda cada archivo en memoria y en Render gratuito (512 MB) lo que se
 * acota es la memoria del proceso: 4 peticiones x 3 fotos x 5 MB = 60 MB en el peor caso. Solo con el tope global, una
 * cuenta con subidas a gotas podria ocupar los 4 cupos y dejar fuera a todos; por cuenta (1) necesita 4 cuentas.
 * El limitador por IP de pedidos.routes.ts frena abuso en el tiempo; este frena la concurrencia.
 * [DECISION] corte por ancho de banda minimo y por plazo, no solo por "sin bytes" - un cliente que manda un byte cada pocos
 * segundos mueve bytesRead y nunca parece estancado; con 4 cuentas podria ocupar los 4 cupos hasta el timeout total (120 s).
 * El piso (10 KB por revision de 10 s, ~1 KB/s) deja pasar cualquier conexion movil real; el plazo (60 s) acota el cupo.
 * @param opciones - `max` en total (4), `maxPorUsuario` (1), `inactividadMs` ventana de dos revisiones (20 s),
 *                   `minBytesPorRevision` que debe llegar entre revisiones (10 KB), `plazoSubidaMs` para terminar de recibir
 *                   el cuerpo (60 s) y `skip` para saltar el limite (en test por defecto).
 * @returns Middleware: 503 con Retry-After si ya hay `max` en curso, 429 si la cuenta ya tiene `maxPorUsuario`. El cupo se
 *          libera al terminar la respuesta o al cortarse la conexion. Va despues de requireAuth.
 */
export function limitarSubidasEnCurso({
  max = 4,
  maxPorUsuario = 1,
  inactividadMs = 20_000,
  minBytesPorRevision = 10_000,
  plazoSubidaMs = 60_000,
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

    // se corta al cliente que no llega al piso de bytes entre dos revisiones o que pasa del plazo para terminar de enviar:
    // no retiene el cupo hasta el timeout total. Termina de vigilar cuando el cuerpo ya llego completo (req.complete): lo que
    // sigue, subir a Cloudinary, depende del servidor y no del cliente.
    // Se mira socket.bytesRead y no req.on('data'): enganchar 'data' aqui pondria el stream en modo fluido antes de que multer lo lea
    const inicio = Date.now()
    let leidos = req.socket.bytesRead
    const vigilante = setInterval(() => {
      if (req.complete) return clearInterval(vigilante)
      const llegaron = req.socket.bytesRead - leidos
      leidos = req.socket.bytesRead
      if (llegaron < minBytesPorRevision || Date.now() - inicio >= plazoSubidaMs) req.destroy()
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
