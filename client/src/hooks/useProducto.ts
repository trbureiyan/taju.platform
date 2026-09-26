import { useEffect, useState, useCallback } from 'react'
import { api, ErrorApi } from '../lib/api'
import type { Producto } from '../types'

type Estado = 'cargando' | 'listo' | 'no-encontrado' | 'error'

/**
 * Carga un producto. Si llega el producto desde la tarjeta, se muestra de inmediato y se refresca en segundo plano.
 * Montar con key={id}: cambiar de producto reinicia el estado sin setState dentro del efecto.
 * @param id - Id del producto.
 * @param inicial - Producto recibido por el estado de navegación, si existe.
 * @returns producto, estado ('cargando' | 'listo' | 'no-encontrado' | 'error') y reintentar().
 */
export function useProducto(id: string, inicial?: Producto) {
  const [producto, setProducto] = useState<Producto | null>(inicial ?? null)
  const [estado, setEstado] = useState<Estado>(inicial ? 'listo' : 'cargando')
  const [intento, setIntento] = useState(0)

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
  }, [id, intento])

  const reintentar = useCallback(() => {
    setEstado('cargando')
    setIntento((n) => n + 1)
  }, [])

  return { producto, estado, reintentar }
}
