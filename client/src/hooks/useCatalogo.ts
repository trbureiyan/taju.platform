import { useState, useEffect, useCallback } from 'react'
import { api, getToken } from '../lib/api'
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
  // el token vive fuera de React: se lee en cada render para notar un cierre de sesion con la vista montada
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
        // con catalogo en memoria, un refresco fallido no borra lo que la persona ya esta viendo
        if (!cancelado && cache?.token !== token) setEstado({ productos: [], cargando: false, error: err.message })
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
