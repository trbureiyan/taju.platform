import { useId, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

export function Input({ label, error, hint, id, className = '', ...props }: InputProps) {
  // useId en vez de derivar del label - dos Input con la misma etiqueta (ej. "Nombre" en dos formularios
  // distintos de la misma pagina) no deben terminar compartiendo id/aria-describedby
  const idGenerado = useId()
  const inputId = id ?? idGenerado
  const hintId = hint ? `${inputId}-hint` : undefined
  const errorId = error ? `${inputId}-error` : undefined

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-texto-principal">
        {label}
      </label>
      <input
        id={inputId}
        // encadena hint y error en un solo aria-describedby - un lector de pantalla lee ambos si aplican
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        aria-invalid={error ? true : undefined}
        className={[
          'w-full rounded-campo border px-3 py-2 text-base text-texto-principal',
          'bg-campo-fondo placeholder:text-texto-tenue',
          'min-h-boton outline-none transition-shadow focus-visible:shadow-foco',
          // el borde rojo ya comunica el error - el anillo de foco se mantiene igual, nunca se quita
          error ? 'border-error-borde' : 'border-borde-defecto hover:border-borde-activo',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      />
      {/* si hay error, el hint se oculta - un solo mensaje de ayuda a la vez, no se amontonan */}
      {hint && !error && (
        <p id={hintId} className="text-xs text-texto-secundario">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-error-texto" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
