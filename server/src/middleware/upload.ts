import multer from 'multer'
import type { Request, Response, NextFunction } from 'express'

const MAX_SIZE = 5 * 1024 * 1024 // 5 MB
const MAX_FILES = 3 // suficiente para dar contexto visual sin volver pesado el formulario del pedido

// ─── Configuracion base de multer ─────────────────────────────────────────────
// memoryStorage porque el buffer se sube directo a Cloudinary, nunca toca disco local
const _multer = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE, files: MAX_FILES },
  fileFilter(_req, file, cb) {
    if (file.mimetype === 'image/jpeg') {
      cb(null, true)
    } else {
      cb(new Error('Solo se aceptan imágenes JPG (image/jpeg)'))
    }
  },
}).array('imagenes', MAX_FILES) // el campo del form-data se llama "imagenes" en plural, coincide con PedidoFormPage

// ─── Middleware expuesto ────────────────────────────────────────────────────
// envolvemos multer a mano para traducir sus errores a la forma de respuesta que usa el resto de la api
export function uploadImagen(req: Request, res: Response, next: NextFunction): void {
  _multer(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // MulterError trae su propio codigo - LIMIT_FILE_SIZE es el unico que traducimos a mensaje amigable,
      // el resto (demasiados archivos, campo raro) cae al mensaje generico de abajo
      const mensaje =
        err.code === 'LIMIT_FILE_SIZE'
          ? 'Cada imagen debe pesar menos de 5 MB'
          : `Error al procesar imagen: ${err.message}`
      res.status(400).json({ error: mensaje })
      return
    }
    if (err instanceof Error) {
      // este es el Error que lanza fileFilter cuando el mimetype no es jpeg
      res.status(400).json({ error: err.message })
      return
    }
    next()
  })
}
