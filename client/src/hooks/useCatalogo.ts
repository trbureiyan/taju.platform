import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import type { Producto, Familia } from '../types'

interface Estado {
  productos: Producto[]
  cargando: boolean
  error: string | null
}

// null trae el catalogo completo, una familia especifica filtra en el server - ver CatalogoPage
/**
 * Carga el catálogo de productos, filtrando opcionalmente por familia.
 * @param familia - Familia a filtrar, o null para traer todo el catálogo activo.
 * @returns Estado con productos (array, vacío mientras carga), cargando (bool) y error (string|null).
 *          Actualiza automáticamente cuando cambia la familia.
 */
export function useCatalogo(familia: Familia | null) {
  const [estado, setEstado] = useState<Estado>({ productos: [], cargando: true, error: null })

  useEffect(() => {
    let cancelado = false // evita el "setState en componente desmontado" si cambian de familia rapido

    // muestra "cargando" en cada cambio de familia conservando los productos anteriores visibles
    // mientras tanto — evita salto a vacío. setState sincrónico aquí es intencional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEstado((prev) => ({ ...prev, cargando: true, error: null }))

    const path = familia ? `/productos?familia=${familia}` : '/productos'

    api
      .get<Producto[]>(path)
      .then((productos) => {
        if (!cancelado) setEstado({ productos, cargando: false, error: null })
      })
      .catch((err: Error) => {
        if (!cancelado) setEstado({ productos: [], cargando: false, error: err.message })
      })

    return () => {
      cancelado = true
    }
  }, [familia])

  return estado
}
