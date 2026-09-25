import express from 'express'
import cors from 'cors'
import { errorHandler } from './lib/errors.js'
import routes from './routes/index.js'

// separado de index.ts para que los tests levanten la misma app sin abrir conexion ni puerto por su cuenta
/**
 * Arma la aplicación Express con middleware global, rutas y manejador de errores.
 * No conecta a MongoDB ni escucha en ningún puerto.
 * @returns Instancia de Express lista para app.listen().
 */
export function crearApp() {
  const app = express()

  // ─── Middleware global ─────────────────────────────────────────────────────
  // cors abierto: el front todavia no tiene dominio propio fijo (dev + varios previews)
  app.use(cors())
  app.use(express.json())

  // ─── Rutas ──────────────────────────────────────────────────────────────────
  // probe simple para monitoreo/deploy, sin auth
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  app.use('/api', routes)

  // ultimo middleware - captura AppError de los services y cualquier rechazo de asyncHandler
  app.use(errorHandler)

  return app
}
