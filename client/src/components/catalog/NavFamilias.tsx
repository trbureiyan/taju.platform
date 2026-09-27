import { Link } from 'react-router-dom'
import { FAMILIAS, ETIQUETAS_FAMILIA } from '../../types'
import type { Familia } from '../../types'

/**
 * Familias como navegación en tipografía grande (sweetgreen): el tamaño del texto es la señal, no un chip.
 * @prop activa - Familia actual, o null para "Todas".
 * @prop href - Arma el enlace de una familia conservando búsqueda y orden.
 */
export function NavFamilias({
  activa,
  href,
}: {
  activa: Familia | null
  href: (f: Familia | null) => string
}) {
  const opciones: [Familia | null, string][] = [
    [null, 'Todas'],
    ...FAMILIAS.map((f) => [f, ETIQUETAS_FAMILIA[f]] as [Familia, string]),
  ]

  return (
    <nav aria-label="Familias" className="-mx-4 px-4 overflow-x-auto">
      {/* enlaces y no botones: cambian la URL, y aria-current dice cual es la pagina actual */}
      <ul className="flex gap-6 lg:gap-8 w-max">
        {opciones.map(([familia, nombre]) => {
          const actual = familia === activa
          return (
            <li key={nombre}>
              <Link
                to={href(familia)}
                aria-current={actual ? 'page' : undefined}
                className={[
                  'inline-flex items-center min-h-boton text-lg lg:text-h3 border-b-2 transition-colors duration-normal ease-estandar',
                  actual
                    ? 'font-semibold text-texto-principal border-borde-fuerte'
                    : 'text-texto-secundario border-transparent hover:text-texto-principal',
                ].join(' ')}
              >
                {nombre}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
