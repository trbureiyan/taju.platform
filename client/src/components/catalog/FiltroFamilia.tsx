import type { Familia } from '../../types'
import { ETIQUETAS_FAMILIA } from '../../types'

/**
 * Props del filtro de familia del catálogo.
 * @prop seleccionada - Familia actualmente seleccionada, o null para "Todos".
 * @prop onChange - Callback invocado con la nueva familia o null al seleccionar "Todos".
 */
interface FiltroFamiliaProps {
  seleccionada: Familia | null
  onChange: (familia: Familia | null) => void
}

// las 4 familias salen del mismo mapa que usan las etiquetas, asi nunca se desalinean
const FAMILIAS = Object.keys(ETIQUETAS_FAMILIA) as Familia[]

// morph de fondo/borde con la curva expresiva de marca, mas leve press feedback - mismo lenguaje que Button
const CLASE_BASE_CHIP =
  'px-4 py-2 rounded-full text-sm font-medium min-h-[44px] border transition-[background-color,border-color,transform] duration-normal ease-estandar active:scale-97'

export function FiltroFamilia({ seleccionada, onChange }: FiltroFamiliaProps) {
  return (
    <nav aria-label="Filtrar por familia" className="flex flex-wrap gap-2">
      {/* "Todos" no es parte de Familia, se maneja aparte con null en vez de meterlo en el enum de dominio */}
      <button
        onClick={() => onChange(null)}
        aria-pressed={seleccionada === null}
        className={[
          CLASE_BASE_CHIP,
          seleccionada === null
            ? 'bg-accion text-accion-texto border-accion'
            : 'bg-transparent text-texto-secundario border-borde-defecto hover:border-borde-activo',
        ].join(' ')}
      >
        Todos
      </button>
      {FAMILIAS.map((familia) => (
        <button
          key={familia}
          onClick={() => onChange(familia)}
          aria-pressed={seleccionada === familia}
          className={[
            CLASE_BASE_CHIP,
            seleccionada === familia
              ? 'bg-accion text-accion-texto border-accion'
              : 'bg-transparent text-texto-secundario border-borde-defecto hover:border-borde-activo',
          ].join(' ')}
        >
          {ETIQUETAS_FAMILIA[familia]}
        </button>
      ))}
    </nav>
  )
}
