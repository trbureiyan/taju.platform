import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import type { Producto } from '../types'

interface Estado {
  productos: Producto[]
  cargando: boolean
  error: string | null
}

// [DECISION] todo el catalogo en una llamada y filtros en el cliente - con 30 a 100 productos el volumen es chico y
// cambiar de familia deja de ser otra espera contra Render. Si el catalogo pasa de ~100, mover busqueda y paginacion al server.
/**
 * Carga el catálogo activo completo.
 * @returns productos, cargando, error (mensaje o null) y reintentar(), que vuelve a pedir sin recargar la página.
 */
export function useCatalogo() {
  const [estado, setEstado] = useState<Estado>({ productos: [], cargando: true, error: null })
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let cancelado = false
    api
      .get<Producto[]>('/productos')
      .then((productos) => {
        if (!cancelado) setEstado({ productos, cargando: false, error: null })
      })
      .catch((err: Error) => {
        if (!cancelado) setEstado({ productos: [], cargando: false, error: err.message })
      })
    return () => {
      cancelado = true
    }
  }, [intento])

  const reintentar = useCallback(() => {
    setEstado((prev) => ({ ...prev, cargando: true, error: null }))
    setIntento((n) => n + 1)
  }, [])

  return { ...estado, reintentar }
}
