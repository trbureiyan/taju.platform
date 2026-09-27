import { useEffect } from 'react'
import { BASE } from '../lib/api'

// Render free corta la peticion colgada si el servidor no llega a despertar; mas alla de eso ya no ayuda
const CORTE_MS = 60_000

// una vez por carga de la app: Layout no se remonta al cambiar de ruta, y la bandera cubre el doble montaje de StrictMode
let yaDespertado = false

/**
 * Arma la URL del probe de salud del servidor a partir de la base de la API.
 * @param base - Base de la API (VITE_API_URL), que termina en /api.
 * @returns origen + '/health'. /health cuelga de la raiz del servidor, no de /api (ver server/src/app.ts).
 */
export function urlSalud(base: string): string {
  return `${new URL(base, window.location.origin).origin}/health`
}

// [DECISION] ping desde el cliente ademas de keep-alive.yml - el workflow es el mecanismo principal pero falla en
// silencio: GitHub desactiva crons tras 60 dias sin push, el cron es best-effort y puede saltarse, y puede apagarse
// para ahorrar horas de Render. Este ping es la red de seguridad; no borrar sin reemplazo.
/**
 * Despierta al servidor de Render apenas carga la app, sin esperar a que una vista pida datos.
 * Una sola petición por carga, sin reintento, sin UI; si falla no pasa nada (cada vista maneja sus propios errores).
 * @param base - Base de la API; por defecto la de lib/api.
 */
export function useDespertarServidor(base: string = BASE): void {
  useEffect(() => {
    if (yaDespertado) return
    yaDespertado = true

    const control = new AbortController()
    const corte = setTimeout(() => control.abort(), CORTE_MS)
    fetch(urlSalud(base), { signal: control.signal, cache: 'no-store' })
      .catch(() => {})
      .finally(() => clearTimeout(corte))
    // sin cleanup que aborte: el doble montaje de StrictMode cancelaria el unico ping de la carga
  }, [base])
}
