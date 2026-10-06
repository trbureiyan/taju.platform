import { useId, type InputHTMLAttributes, type ReactNode } from 'react'

/**
 * Casilla de verificación con el control HTML real por debajo.
 * @prop etiqueta - Texto (o texto con enlace) de la casilla; todo el renglón es objetivo táctil.
 * @prop error - Mensaje de error; activa aria-invalid y se enlaza con aria-describedby.
 * @prop anunciarError - Por defecto true. Si es false el error no lleva role=alert (un aviso de resumen lo anuncia).
 */
interface CasillaProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  etiqueta: ReactNode
  error?: string
  anunciarError?: boolean
}

export function Casilla({ etiqueta, error, anunciarError = true, id, className = '', ...props }: CasillaProps) {
  const idGenerado = useId()
  const casillaId = id ?? idGenerado
  const errorId = error ? `${casillaId}-error` : undefined

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={casillaId} className="flex min-h-boton cursor-pointer items-start gap-3 text-sm text-texto-principal">
        <input
          id={casillaId}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className={[
            'mt-1 h-6 w-6 shrink-0 cursor-pointer rounded-campo accent-accion outline-none focus-visible:shadow-foco',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />
        <span>{etiqueta}</span>
      </label>
      {error && (
        <p id={errorId} className="text-xs text-error-texto" role={anunciarError ? 'alert' : undefined}>
          {error}
        </p>
      )}
    </div>
  )
}
