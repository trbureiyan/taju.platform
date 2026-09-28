import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { errorHandler } from './lib/errors.js'
import routes from './routes/index.js'

// mismo patron que secret() en jwt.ts: falla al armar la app, no en el primer request real
function clientUrlDeProduccion(): string {
  const url = process.env.CLIENT_URL
  if (!url) throw new Error('CLIENT_URL no definida - requerida en produccion para restringir CORS')
  return url
}

// separado de index.ts para que los tests levanten la misma app sin abrir conexion ni puerto por su cuenta
/**
 * Arma la aplicación Express con middleware global, rutas y manejador de errores.
 * No conecta a MongoDB ni escucha en ningún puerto.
 * @returns Instancia de Express lista para app.listen().
 */
export function crearApp() {
  const app = express()

  // ─── Middleware global ─────────────────────────────────────────────────────
  // un nivel de proxy (Render) — sin esto req.ip es la IP del proxy y el rate limiter
  // cuenta todos los clientes juntos, vaciando el limite de IPs distintas
  app.set('trust proxy', 1)

  // helmet antes de cors: agrega cabeceras de seguridad sin interferir con las de cors
  app.use(helmet())

  // en produccion el origen es fijo (CLIENT_URL) - en desarrollo sigue abierto porque
  // el front todavia rota entre localhost y varios previews sin dominio unico
  const corsOptions: cors.CorsOptions =
    process.env.NODE_ENV === 'production' ? { origin: clientUrlDeProduccion() } : {}
  app.use(cors(corsOptions))

  // 100 KB es mas que suficiente para cualquier payload legitimo de esta API
  app.use(express.json({ limit: '100kb' }))

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
