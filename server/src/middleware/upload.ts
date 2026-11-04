import multer from 'multer'
import type { Request, Response, NextFunction } from 'express'
import { TIPOS_IMAGEN } from '../types/index.js'
import { inspeccionarImagen, ImagenInvalidaError } from '../lib/inspeccionarImagen.js'

// [DECISION] 5 MB y no los 25 MB que ve la persona - el navegador reduce cada foto antes de subirla (comprimirImagen.ts),
// asi que el servidor recibe fracciones de MB. Un techo bajo acota la memoria por peticion (memoryStorage) y la superficie de ataque.
export const MAX_SIZE = 5 * 1024 * 1024 // 5 MB
export const MAX_FILES = 3 // suficiente para dar contexto visual sin volver pesado el formulario del pedido

const MARGEN_CAMPOS = 64 * 1024 // los campos de texto y los limites del multipart caben de sobra en 64 KB

// escritos para el cliente: la lista blanca de client/src/lib/errorEnvio.ts los repite letra por letra
export const MENSAJE_PESO = 'Cada imagen debe pesar menos de 5 MB'
export const MENSAJE_DIMENSIONES = 'Una de tus imágenes tiene demasiados píxeles. Redúcela o envíanosla por WhatsApp.'
export const MENSAJE_ILEGIBLE = 'No pudimos leer una de tus imágenes. Prueba con otra en JPG, PNG o WebP.'
const MENSAJE_FIRMA = 'Uno de los archivos no es una imagen JPG, PNG o WebP válida'

// ─── Configuracion base de multer ─────────────────────────────────────────────
// memoryStorage porque el buffer se sube directo a Cloudinary, nunca toca disco local
const _multer = multer({
  storage: multer.memoryStorage(),
  // express.json no cubre multipart: sin fields/fieldSize/parts un usuario con cuenta podia mandar miles de campos de 1 MB en memoria.
  // el formulario manda ~12 campos de texto; el margen no toca ningun pedido legitimo
  limits: { fileSize: MAX_SIZE, files: MAX_FILES, fields: 30, fieldSize: 16 * 1024, parts: 40 },
  fileFilter(_req, file, cb) {
    if ((TIPOS_IMAGEN as readonly string[]).includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Solo se aceptan imágenes JPG, PNG o WebP'))
    }
  },
}).array('imagenes', MAX_FILES) // el campo del form-data se llama "imagenes" en plural, coincide con armarSolicitud (client/src/hooks/useSolicitud.ts)

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
  // rechazo temprano: un Content-Length mayor a lo que caben 3 fotos mas los campos no merece ni leerse.
  // Connection: close para que el servidor no se quede drenando un cuerpo que ya se descarto
  const declarado = Number(req.headers['content-length'])
  if (declarado > MAX_FILES * MAX_SIZE + MARGEN_CAMPOS) {
    res.setHeader('Connection', 'close')
    res.status(400).json({ error: MENSAJE_PESO })
    return
  }

  _multer(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // MulterError trae su propio codigo - LIMIT_FILE_SIZE es el unico que traducimos a mensaje amigable,
      // el resto (demasiados archivos, campo raro) cae al mensaje generico de abajo
      const mensaje =
        err.code === 'LIMIT_FILE_SIZE'
          ? MENSAJE_PESO
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
      res.status(400).json({ error: MENSAJE_FIRMA })
      return
    }

    // la firma prueba el tipo; la cabecera prueba que no declare millones de pixeles que Cloudinary tendria que decodificar
    for (const archivo of archivos) {
      try {
        inspeccionarImagen(archivo.buffer)
      } catch (error) {
        if (!(error instanceof ImagenInvalidaError)) throw error
        const mensaje =
          error.motivo === 'dimensiones' ? MENSAJE_DIMENSIONES : error.motivo === 'firma' ? MENSAJE_FIRMA : MENSAJE_ILEGIBLE
        res.status(400).json({ error: mensaje })
        return
      }
    }

    next()
  })
}
