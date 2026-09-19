import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variante = 'primario' | 'secundario' | 'fantasma'
type Tamano = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  tamano?: Tamano
  cargando?: boolean
  children: ReactNode
}

// primario es la unica accion de marca por pantalla (ver .docs/branding) - secundario/fantasma son de apoyo
const estilosVariante: Record<Variante, string> = {
  primario:
    'bg-accion text-accion-texto hover:bg-accion-hover active:bg-accion-activo focus-visible:ring-2',
  secundario:
    'bg-accion-sec-fondo text-accion-sec-texto border border-accion-sec-borde hover:bg-superficie-elevada active:bg-superficie-hundida',
  fantasma:
    'bg-transparent text-texto-secundario hover:text-texto-principal hover:bg-superficie-elevada',
}

// min-h-boton = --boton-alto, el objetivo tactil accesible en las tres tallas sin importar cuan chico se pida el boton
const estilosTamano: Record<Tamano, string> = {
  sm: 'px-3 py-1 text-sm min-h-boton',
  md: 'px-4 py-2 text-base min-h-boton',
  lg: 'px-6 py-3 text-base min-h-boton',
}

export function Button({
  variante = 'primario',
  tamano = 'md',
  cargando = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || cargando} // cargando bloquea el click aunque nadie haya pasado disabled explicito
      aria-busy={cargando}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-boton font-medium transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        estilosVariante[variante],
        estilosTamano[tamano],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {/* el nombre accesible del boton no cambia mientras carga - el spinner es decorativo, aria-hidden */}
      {cargando && (
        <span className="animate-spin" aria-hidden="true">
          ⋯
        </span>
      )}
      {children}
    </button>
  )
}
