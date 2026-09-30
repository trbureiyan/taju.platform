import multer from 'multer'
import type { Request, Response, NextFunction } from 'express'
import { TIPOS_IMAGEN } from '../types/index.js'

const MAX_SIZE = 5 * 1024 * 1024 // 5 MB
const MAX_FILES = 3 // suficiente para dar contexto visual sin volver pesado el formulario del pedido

// ─── Configuracion base de multer ─────────────────────────────────────────────
// memoryStorage porque el buffer se sube directo a Cloudinary, nunca toca disco local
const _multer = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE, files: MAX_FILES },
  fileFilter(_req, file, cb) {
    if ((TIPOS_IMAGEN as readonly string[]).includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Solo se aceptan imágenes JPG, PNG o WebP'))
    }
  },
}).array('imagenes', MAX_FILES) // el campo del form-data se llama "imagenes" en plural, coincide con PedidoFormPage

const FIRMA_PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

// el mimetype lo declara el cliente y no prueba nada: solo la firma real de los primeros bytes lo hace
function firmaCoincide(buffer: Buffer, mimetype: string): boolean {
  switch (mimetype) {
    case 'image/jpeg':
      return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
    case 'image/png':
      return buffer.length >= 8 && buffer.subarray(0, 8).equals(FIRMA_PNG)
    case 'image/webp':
      return buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP'
    default:
      return false
  }
}

/**
 * Middleware para procesar subida de imágenes (multipart/form-data).
 * Valida que los archivos no excedan el peso, sean JPG, PNG o WebP válidos (revisando magic bytes),
 * y los deja disponibles en req.files como buffers en memoria.
 * Retorna 400 con un mensaje de error si la validación falla.
 */
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
      // este es el Error que lanza fileFilter cuando el mimetype declarado no es JPG, PNG ni WebP
      res.status(400).json({ error: err.message })
      return
    }

    const archivos = (req.files as Express.Multer.File[]) ?? []
    const archivoInvalido = archivos.find((f) => !firmaCoincide(f.buffer, f.mimetype))
    if (archivoInvalido) {
      res.status(400).json({ error: 'Uno de los archivos no es una imagen JPG, PNG o WebP válida' })
      return
    }

    next()
  })
}
