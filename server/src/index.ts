// side-effect import: debe ser el primero para que dotenv corra antes de que
// cualquier modulo importado mas abajo (p. ej. cloudinary.ts) lea process.env
import 'dotenv/config'
import { connectDb } from './lib/db.js'
import { crearApp } from './app.js'
import { verificarSecretoJwt } from './lib/jwt.js'
import { aplicarTiemposServidor } from './lib/tiemposServidor.js'

// antes de todo: si el secreto falta o es corto el deploy cae aqui con el motivo en el log, no en el primer login
verificarSecretoJwt()

const app = crearApp()
const PORT = process.env.PORT ?? 3001

// ─── Arranque ─────────────────────────────────────────────────────────────────
// no levantamos el server hasta tener la conexion a mongo, para no aceptar requests contra una db muerta
connectDb()
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`servidor taju en :${PORT}`)
    })
    aplicarTiemposServidor(server)
  })
  .catch((err) => {
    console.error('Error conectando a MongoDB:', err)
    process.exit(1)
  })
