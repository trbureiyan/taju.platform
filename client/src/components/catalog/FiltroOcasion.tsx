/**
 * Props del filtro de ocasión del catálogo.
 * @prop ocasiones - Valores distintos de especificacionesTecnicas.ocasion presentes en los productos cargados.
 * @prop seleccionada - Ocasión actualmente seleccionada, o null para "Todas".
 * @prop onChange - Callback invocado con la nueva ocasión o null al volver a "Todas".
 */
interface FiltroOcasionProps {
  ocasiones: string[]
  seleccionada: string | null
  onChange: (ocasion: string | null) => void
}

// mismo lenguaje visual que FiltroFamilia, pero es contexto (turquesa) no accion (rosa/marca) -
// la ocasion es una lente secundaria sobre el catalogo, la familia sigue siendo el filtro principal
const CLASE_BASE_CHIP =
  'px-4 py-2 rounded-full text-sm font-medium min-h-[44px] border transition-[background-color,border-color,transform] duration-normal ease-estandar active:scale-97'

export function FiltroOcasion({ ocasiones, seleccionada, onChange }: FiltroOcasionProps) {
  // sin ocasiones cargadas por el taller, el filtro no tiene nada que ofrecer - no se renderiza un chip vacio
  if (ocasiones.length === 0) return null

  return (
    <nav aria-label="Filtrar por ocasión" className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange(null)}
        aria-pressed={seleccionada === null}
        className={[
          CLASE_BASE_CHIP,
          seleccionada === null
            ? 'bg-contexto text-contexto-texto border-contexto'
            : 'bg-transparent text-texto-secundario border-borde-defecto hover:border-borde-activo',
        ].join(' ')}
      >
        Todas las ocasiones
      </button>
      {ocasiones.map((ocasion) => (
        <button
          key={ocasion}
          onClick={() => onChange(ocasion)}
          aria-pressed={seleccionada === ocasion}
          className={[
            CLASE_BASE_CHIP,
            seleccionada === ocasion
              ? 'bg-contexto text-contexto-texto border-contexto'
              : 'bg-transparent text-texto-secundario border-borde-defecto hover:border-borde-activo',
          ].join(' ')}
        >
          {ocasion}
        </button>
      ))}
    </nav>
  )
}
