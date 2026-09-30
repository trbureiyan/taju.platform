import { useId, type SelectHTMLAttributes } from 'react'

/**
 * Props del selector nativo. Mismo contrato visual que `Input`: etiqueta, ayuda y error.
 * @prop label - Etiqueta visible asociada al select mediante htmlFor.
 * @prop error - Mensaje de error; activa aria-invalid y oculta hint.
 * @prop hint - Texto de ayuda; se muestra cuando no hay error activo.
 * @prop anunciarError - Por defecto true. Si es false el error se muestra sin role=alert; lo usa el formulario por momentos, que anuncia un solo aviso de resumen.
 */
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  hint?: string
  anunciarError?: boolean
}

export function Select({ label, error, hint, anunciarError = true, id, className = '', children, ...props }: SelectProps) {
  const idGenerado = useId()
  const selectId = id ?? idGenerado
  const hintId = hint && !error ? `${selectId}-hint` : undefined
  const errorId = error ? `${selectId}-error` : undefined

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={selectId} className="text-sm font-medium text-texto-principal">
        {label}
      </label>
      <select
        id={selectId}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        aria-invalid={error ? true : undefined}
        className={[
          'w-full rounded-campo border px-3 py-2 text-base text-texto-principal bg-campo-fondo',
          'min-h-boton outline-none transition-shadow focus-visible:shadow-foco',
          error ? 'border-error-borde' : 'border-borde-defecto hover:border-borde-activo',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {children}
      </select>
      {hint && !error && (
        <p id={hintId} className="text-xs text-texto-secundario">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-error-texto" role={anunciarError ? 'alert' : undefined}>
          {error}
        </p>
      )}
    </div>
  )
}
