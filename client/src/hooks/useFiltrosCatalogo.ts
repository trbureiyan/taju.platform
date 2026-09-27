import { useSearchParams } from 'react-router-dom'
import { familiaDesdeParam } from '../lib/familia'
import { ETIQUETAS_ORDEN } from '../lib/catalogo'
import type { Orden } from '../lib/catalogo'
import type { Familia } from '../types'

interface Cambios {
  familia?: Familia | null
  q?: string
  orden?: Orden
  ocasion?: string | null
}

const POR_DEFECTO = { orden: 'recomendados' }

function ordenDesdeParam(valor: string | null): Orden {
  // `in` acepta claves del prototipo (?orden=constructor); Object.hasOwn pide lib ES2022 y el client compila con ES2020
  return valor && Object.prototype.hasOwnProperty.call(ETIQUETAS_ORDEN, valor) ? (valor as Orden) : 'recomendados'
}

/**
 * Filtros del catálogo con la URL como única fuente: se pueden compartir, "atrás" deshace y recargar no borra nada.
 * @returns Los filtros leídos, actualizar(), limpiar(), hrefFamilia() y si hay algún filtro activo.
 */
export function useFiltrosCatalogo() {
  const [params, setParams] = useSearchParams()
  const familia = familiaDesdeParam(params.get('familia'))
  const q = params.get('q') ?? ''
  const orden = ordenDesdeParam(params.get('orden'))
  const ocasion = params.get('ocasion') || null

  function aplicar(base: URLSearchParams, cambios: Cambios): URLSearchParams {
    const nuevos = new URLSearchParams(base)
    for (const [clave, valor] of Object.entries(cambios)) {
      // los valores por defecto no se escriben: la URL limpia es "/catalogo", no "/catalogo?orden=recomendados"
      if (valor == null || valor === '' || POR_DEFECTO[clave as keyof typeof POR_DEFECTO] === valor)
        nuevos.delete(clave)
      else nuevos.set(clave, valor)
    }
    return nuevos
  }

  /**
   * @param cambios - Filtros a cambiar; null o '' los quita.
   * @param reemplazar - true para no apilar historial (el buscador, letra por letra).
   */
  function actualizar(cambios: Cambios, reemplazar = false) {
    setParams((prev) => aplicar(prev, cambios), { replace: reemplazar })
  }

  function limpiar() {
    actualizar({ familia: null, q: '', ocasion: null })
  }

  function hrefFamilia(nueva: Familia | null): string {
    const query = aplicar(params, { familia: nueva }).toString()
    return query ? `/catalogo?${query}` : '/catalogo'
  }

  return {
    familia,
    q,
    orden,
    ocasion,
    actualizar,
    limpiar,
    hrefFamilia,
    hayFiltros: !!(familia || q || ocasion),
  }
}
