import { v2 as cloudinary } from 'cloudinary'
import { AppError } from './errors.js'

// config global del SDK - se ejecuta una vez al importar el modulo, no por request
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export interface ImagenSubida {
  url: string
  publicId: string
}

/** Cloudinary no pudo procesar la imagen (peso, pixeles o contenido que no acepta): se le avisa a la persona, no es un 500. */
export class ImagenRechazadaError extends AppError {
  constructor() {
    super(400, 'No pudimos procesar una de tus imágenes. Prueba con otra o escríbenos por WhatsApp.')
  }
}

/**
 * Sube una imagen a Cloudinary desde un buffer en memoria, por stream.
 * [DECISION] stream y no Data URI - el base64 agrega un 33 % de memoria por imagen y una copia de la cadena.
 * La transformacion entrante se aplica antes de guardar (documentado por Cloudinary): la imagen guardada es la
 * re-codificada a 2000 px como maximo, no el archivo original. Que eso elimine bytes pegados al final del archivo
 * no esta documentado; se comprueba a mano (plan imagenes-limites-seguros, accion manual 3).
 * @param buffer - Contenido binario de la imagen, ya validado por upload.ts.
 * @returns URL segura (https) y public_id de la imagen alojada. El public_id se
 *          guarda solo en memoria del caller para poder borrar la imagen si el
 *          pedido asociado nunca se confirma (ver crearPedido).
 * @throws ImagenRechazadaError si Cloudinary responde 400; cualquier otro fallo se propaga tal cual.
 */
export function subirImagen(buffer: Buffer): Promise<ImagenSubida> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'taju/pedidos', // todo lo del taller vive bajo este prefijo, mas facil de administrar desde el dashboard
        resource_type: 'image',
        allowed_formats: ['jpg', 'png', 'webp'],
        transformation: [{ width: 2000, height: 2000, crop: 'limit' }, { quality: 'auto' }],
        timeout: 60_000,
      },
      (error, result) => {
        if (error || !result) {
          reject(error?.http_code === 400 ? new ImagenRechazadaError() : (error ?? new Error('Cloudinary no devolvio resultado')))
          return
        }
        resolve({ url: result.secure_url, publicId: result.public_id })
      },
    )
    stream.end(buffer)
  })
}

/**
 * Borra una imagen de Cloudinary por su public_id.
 * Uso: limpieza best-effort de subidas huerfanas cuando el pedido que las
 * referenciaba nunca se confirma (perdedor de la carrera de idempotencia).
 * @param publicId - Identificador devuelto por subirImagen.
 */
export async function eliminarImagen(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId)
}
