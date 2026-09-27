import { Link } from 'react-router-dom'

/**
 * Enlace de navegación con "text roll": al hover el texto sube y entra una copia desde abajo.
 * @prop to - Ruta destino.
 * @prop children - Texto del enlace (solo texto: se duplica visualmente).
 */
export function EnlaceRodante({ to, children }: { to: string; children: string }) {
  return (
    <Link
      to={to}
      className="group relative inline-flex items-center min-h-boton text-sm text-texto-secundario hover:text-texto-principal"
    >
      {/* la copia es aria-hidden: el lector de pantalla lee el enlace una sola vez */}
      <span className="relative block overflow-hidden">
        <span className="block transition-transform duration-normal ease-estandar group-hover:-translate-y-full motion-reduce:transition-none">
          {children}
        </span>
        <span
          aria-hidden="true"
          className="absolute inset-0 block translate-y-full transition-transform duration-normal ease-estandar group-hover:translate-y-0 motion-reduce:transition-none"
        >
          {children}
        </span>
      </span>
    </Link>
  )
}
