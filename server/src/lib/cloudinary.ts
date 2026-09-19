import { v2 as cloudinary } from 'cloudinary'

// config global del SDK - se ejecuta una vez al importar el modulo, no por request
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

// cloudinary acepta data URI directo, asi que evitamos escribir a disco temporal
export async function subirImagen(buffer: Buffer, mimetype: string): Promise<string> {
  const dataUri = `data:${mimetype};base64,${buffer.toString('base64')}`
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: 'taju/pedidos', // todo lo del taller vive bajo este prefijo, mas facil de administrar desde el dashboard
    resource_type: 'image',
  })
  return result.secure_url // solo la url nos sirve rio abajo, el resto de la respuesta de cloudinary se descarta
}
