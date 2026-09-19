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
    'bg-transparent text-accion border border-accion hover:bg-superficie-elevada active:bg-superficie-hundida',
  fantasma:
    'bg-transparent text-texto-secundario hover:text-texto-principal hover:bg-superficie-elevada',
}

// 44px minimo en las tres tallas, es el objetivo tactil accesible sin importar cuan chico se pida el boton
const estilosTamano: Record<Tamano, string> = {
  sm: 'px-3 py-1.5 text-sm min-h-[44px]',
  md: 'px-4 py-2 text-base min-h-[44px]',
  lg: 'px-6 py-3 text-base min-h-[44px]',
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
      {/* placeholder de spinner con puntos suspensivos - reemplazar por un icono Lucide girando si hace falta mas peso visual */}
      {cargando ? <span className="animate-spin">⋯</span> : children}
    </button>
  )
}
