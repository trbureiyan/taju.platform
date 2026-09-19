import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { connectDb } from './lib/db.js'
import routes from './routes/index.js'

// carga .env antes de leer cualquier process.env de aqui en adelante
dotenv.config()

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
