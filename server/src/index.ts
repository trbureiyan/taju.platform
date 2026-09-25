// side-effect import: debe ser el primero para que dotenv corra antes de que
// cualquier modulo importado mas abajo (p. ej. cloudinary.ts) lea process.env
import 'dotenv/config'
import { connectDb } from './lib/db.js'
import { crearApp } from './app.js'

const app = crearApp()
const PORT = process.env.PORT ?? 3001

// ─── Arranque ─────────────────────────────────────────────────────────────────
// no levantamos el server hasta tener la conexion a mongo, para no aceptar requests contra una db muerta
connectDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`servidor taju en :${PORT}`)
    })
  })
  .catch((err) => {
    console.error('Error conectando a MongoDB:', err)
    process.exit(1)
  })
