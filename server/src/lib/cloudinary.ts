import { v2 as cloudinary } from 'cloudinary'

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

/**
 * Sube una imagen a Cloudinary desde un buffer en memoria usando Data URI.
 * @param buffer - Contenido binario de la imagen.
 * @param mimetype - Tipo MIME (ej. 'image/jpeg').
 * @returns URL segura (https) y public_id de la imagen alojada. El public_id se
 *          guarda solo en memoria del caller para poder borrar la imagen si el
 *          pedido asociado nunca se confirma (ver crearPedido).
 */
export async function subirImagen(buffer: Buffer, mimetype: string): Promise<ImagenSubida> {
  const dataUri = `data:${mimetype};base64,${buffer.toString('base64')}`
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: 'taju/pedidos', // todo lo del taller vive bajo este prefijo, mas facil de administrar desde el dashboard
    resource_type: 'image',
  })
  return { url: result.secure_url, publicId: result.public_id }
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
