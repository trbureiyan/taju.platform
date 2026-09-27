import { useEffect, useState, useCallback } from 'react'
import { api, ErrorApi, getToken } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import type { Producto } from '../types'

type Estado = 'cargando' | 'listo' | 'no-encontrado' | 'error'

/**
 * Carga un producto. Si ya está en el catálogo de esta sesión, se muestra de inmediato y se refresca en segundo plano.
 * Montar con key={id}: cambiar de producto reinicia el estado sin setState dentro del efecto.
 * @param id - Id del producto.
 * @param inicial - Producto del catálogo en memoria de esta sesión (`productoEnCatalogo`), si existe.
 * @returns producto, estado ('cargando' | 'listo' | 'no-encontrado' | 'error') y reintentar().
 */
export function useProducto(id: string, inicial?: Producto) {
  // mismo criterio que useCatalogo: con sesion de administrador el detalle puede traer un producto inactivo,
  // y un cambio de sesion (suscrito via useAuth) lo descarta y vuelve a pedir
  useAuth()
  const token = getToken()
  const [producto, setProducto] = useState<Producto | null>(inicial ?? null)
  const [estado, setEstado] = useState<Estado>(inicial ? 'listo' : 'cargando')
  const [tokenMostrado, setTokenMostrado] = useState(token)
  const [intento, setIntento] = useState(0)

  if (tokenMostrado !== token) {
    setTokenMostrado(token)
    setProducto(null)
    setEstado('cargando')
  }

  useEffect(() => {
    let cancelado = false
    api
      .get<Producto>(`/productos/${id}`)
      .then((p) => {
        if (cancelado) return
        setProducto(p)
        setEstado('listo')
      })
      .catch((err: unknown) => {
        if (cancelado) return
        // 404: el taller lo dio de baja o el enlace esta mal - aunque vengamos de la tarjeta, ya no se puede pedir
        if (err instanceof ErrorApi && err.estado === 404) return setEstado('no-encontrado')
        // fallo de red con el producto ya pintado: se queda lo que hay, el refresco era un extra
        setEstado((actual) => (actual === 'listo' ? 'listo' : 'error'))
      })
    return () => {
      cancelado = true
    }
  }, [id, intento, token])

  const reintentar = useCallback(() => {
    setEstado('cargando')
    setIntento((n) => n + 1)
  }, [])

  return { producto, estado, reintentar }
}
