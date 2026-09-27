import { Search } from 'lucide-react'
import { FiltroOcasion } from './FiltroOcasion'
import { ETIQUETAS_ORDEN } from '../../lib/catalogo'
import type { Orden } from '../../lib/catalogo'

interface BarraCatalogoProps {
  q: string
  orden: Orden
  ocasiones: string[]
  ocasion: string | null
  // null mientras carga: el conteo no se anuncia hasta que hay un numero real
  total: number | null
  alBuscar: (q: string) => void
  alOrdenar: (orden: Orden) => void
  alElegirOcasion: (ocasion: string | null) => void
}

const CLASE_CAMPO =
  'min-h-boton rounded-campo border border-campo-borde bg-campo-fondo text-campo-texto focus-visible:border-borde-activo'

export function BarraCatalogo(p: BarraCatalogoProps) {
  return (
    <div className="sticky top-0 z-encabezado bg-superficie-base border-b border-borde-sutil px-4 py-3">
      <div className="w-full max-w-contenedor mx-auto flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <label htmlFor="buscar-catalogo" className="sr-only">
              Buscar en el catálogo
            </label>
            <Search
              aria-hidden="true"
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-texto-tenue"
            />
            <input
              id="buscar-catalogo"
              type="search"
              value={p.q}
              onChange={(e) => p.alBuscar(e.target.value)}
              placeholder="Buscar por nombre, ej. topper de grado"
              className={['w-full pl-12 pr-4', CLASE_CAMPO].join(' ')}
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="orden-catalogo" className="text-sm font-medium text-texto-principal">
              Ordenar
            </label>
            <select
              id="orden-catalogo"
              value={p.orden}
              onChange={(e) => p.alOrdenar(e.target.value as Orden)}
              className={['px-3', CLASE_CAMPO].join(' ')}
            >
              {Object.entries(ETIQUETAS_ORDEN).map(([valor, etiqueta]) => (
                <option key={valor} value={valor}>
                  {etiqueta}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FiltroOcasion
            ocasiones={p.ocasiones}
            seleccionada={p.ocasion}
            onChange={p.alElegirOcasion}
          />
          {p.total !== null && (
            // aria-live discreto: quien usa lector de pantalla sabe que el filtro hizo algo
            <p role="status" className="text-sm text-texto-secundario cifra">
              {p.total === 1 ? '1 producto' : `${p.total} productos`}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
