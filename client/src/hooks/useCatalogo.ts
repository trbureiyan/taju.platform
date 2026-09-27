import { useState, useEffect, useCallback } from 'react'
import { api, getToken } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import type { Producto } from '../types'

interface Estado {
  productos: Producto[]
  cargando: boolean
  error: string | null
}

// [DECISION] todo el catalogo en una llamada y filtros en el cliente - con 30 a 100 productos el volumen es chico y
// cambiar de familia deja de ser otra espera contra Render. Si el catalogo pasa de ~100, mover busqueda y paginacion al server.
// ultimo catalogo recibido en esta carga de la app: volver del detalle pinta al instante (y el navegador puede
// restaurar el scroll, porque el contenido ya esta) mientras se refresca en segundo plano.
// [!] va atado al token: con sesion de administrador /productos trae tambien los inactivos, y eso no puede
// quedar a la vista de quien navega despues de cerrar sesion
let cache: { token: string | null; productos: Producto[] } | null = null

/** Olvida el catálogo en memoria. Para tests: cada uno arranca sin estado compartido. */
export function olvidarCatalogo() {
  cache = null
}

/** Guarda un catálogo como si lo hubiera traído la sesión actual. Para tests. */
export function guardarCatalogo(productos: Producto[]) {
  cache = { token: getToken(), productos }
}

/**
 * Producto del catálogo en memoria, solo si lo trajo la sesión actual.
 * El detalle lo usa para pintar al instante: a diferencia del historial del navegador, no sobrevive a un cierre de sesión.
 * @param id - Id del producto.
 * @returns El producto, o undefined si no está en el catálogo de esta sesión.
 */
export function productoEnCatalogo(id: string): Producto | undefined {
  if (!cache || cache.token !== getToken()) return undefined
  return cache.productos.find((p) => p._id === id)
}

function estadoInicial(token: string | null): Estado {
  return cache && cache.token === token
    ? { productos: cache.productos, cargando: false, error: null }
    : { productos: [], cargando: true, error: null }
}

/**
 * Carga el catálogo completo que la sesión actual puede ver (el público, o todo si es administrador).
 * @returns productos, cargando, error (mensaje o null) y reintentar(), que vuelve a pedir sin recargar la página.
 */
export function useCatalogo() {
  // suscripcion a la sesion: login y logout re-renderizan este hook aunque la pagina no use AuthContext.
  // El token (que vive fuera de React) es la clave real, porque es lo que decide que devuelve /productos
  useAuth()
  const token = getToken()
  const [estado, setEstado] = useState<Estado>(() => estadoInicial(token))
  const [tokenMostrado, setTokenMostrado] = useState(token)
  const [intento, setIntento] = useState(0)

  if (tokenMostrado !== token) {
    setTokenMostrado(token)
    setEstado(estadoInicial(token))
  }

  useEffect(() => {
    let cancelado = false
    api
      .get<Producto[]>('/productos')
      .then((productos) => {
        // una respuesta que llega despues de un cambio de sesion no alimenta la cache de la sesion nueva
        if (getToken() === token) cache = { token, productos }
        if (!cancelado) setEstado({ productos, cargando: false, error: null })
      })
      .catch((err: Error) => {
        if (cancelado) return
        // con catalogo en memoria de esta sesion, un refresco fallido muestra eso en vez del error
        if (cache?.token === token) setEstado({ productos: cache.productos, cargando: false, error: null })
        else setEstado({ productos: [], cargando: false, error: err.message })
      })
    return () => {
      cancelado = true
    }
  }, [intento, token])

  const reintentar = useCallback(() => {
    setEstado((prev) => ({ ...prev, cargando: true, error: null }))
    setIntento((n) => n + 1)
  }, [])

  return { ...estado, reintentar }
}
