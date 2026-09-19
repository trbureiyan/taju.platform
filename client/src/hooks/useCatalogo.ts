import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import type { Producto, Familia } from '../types'

interface Estado {
  productos: Producto[]
  cargando: boolean
  error: string | null
}

// null trae el catalogo completo, una familia especifica filtra en el server - ver CatalogoPage
export function useCatalogo(familia: Familia | null) {
  const [estado, setEstado] = useState<Estado>({ productos: [], cargando: true, error: null })

  useEffect(() => {
    let cancelado = false // evita el "setState en componente desmontado" si cambian de familia rapido

    // vuelve a mostrar "cargando" en cada cambio de familia, no solo la primera vez - conserva productos
    // viejos en el estado mientras tanto para que la grilla no salte a vacio de golpe
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
