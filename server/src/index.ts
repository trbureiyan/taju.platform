// side-effect import: debe ser el primero para que dotenv corra antes de que
// cualquier modulo importado mas abajo (p. ej. cloudinary.ts) lea process.env
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { connectDb } from './lib/db.js'
import { errorHandler } from './lib/errors.js'
import routes from './routes/index.js'

const app = express()
const PORT = process.env.PORT ?? 3001

// ─── Middleware global ───────────────────────────────────────────────────────
// cors abierto: el front todavia no tiene dominio propio fijo (dev + varios previews)
app.use(cors())
app.use(express.json())

// ─── Rutas ────────────────────────────────────────────────────────────────────
// probe simple para monitoreo/deploy, sin auth
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api', routes)

// ultimo middleware - captura AppError de los services y cualquier rechazo de asyncHandler
app.use(errorHandler)

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
