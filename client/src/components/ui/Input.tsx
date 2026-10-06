import { useId, type InputHTMLAttributes, type ReactNode } from 'react'

/**
 * Props del campo de texto de una línea.
 * @prop label - Etiqueta visible asociada al input mediante htmlFor.
 * @prop error - Mensaje de error; activa aria-invalid y muestra el mensaje en rojo. Oculta hint.
 * @prop hint - Texto de ayuda secundario; se muestra cuando no hay error activo.
 * @prop anunciarError - Por defecto true. Si es false el error se muestra sin role=alert; lo usa el formulario por momentos, que anuncia un solo aviso de resumen.
 * @prop accion - Control opcional dentro del campo, a la derecha, ej. mostrar contraseña.
 */
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
  anunciarError?: boolean
  accion?: ReactNode
}

export function Input({
  label,
  error,
  hint,
  anunciarError = true,
  accion,
  id,
  className = '',
  'aria-describedby': describedByExterno,
  ...props
}: InputProps) {
  // useId en vez de derivar del label - dos Input con la misma etiqueta (ej. "Nombre" en dos formularios
  // distintos de la misma pagina) no deben terminar compartiendo id/aria-describedby
  const idGenerado = useId()
  const inputId = id ?? idGenerado
  // mismo criterio que el render de abajo: con error el hint no se pinta, y aria-describedby no puede apuntar a un id ausente
  const hintId = hint && !error ? `${inputId}-hint` : undefined
  const errorId = error ? `${inputId}-error` : undefined

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-texto-principal">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          // encadena hint, error y el aviso externo que pase quien usa el campo - un lector de pantalla lee todos
          aria-describedby={[hintId, errorId, describedByExterno].filter(Boolean).join(' ') || undefined}
          aria-invalid={error ? true : undefined}
          className={[
            'w-full rounded-campo border px-3 py-2 text-base text-texto-principal',
            'bg-campo-fondo placeholder:text-texto-tenue',
            'min-h-boton outline-none transition-shadow focus-visible:shadow-foco',
            // el borde rojo ya comunica el error - el anillo de foco se mantiene igual, nunca se quita
            error ? 'border-error-borde' : 'border-borde-defecto hover:border-borde-activo',
            accion ? 'pr-12' : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />
        {accion && <div className="absolute inset-y-0 right-0 flex items-center pr-1">{accion}</div>}
      </div>
      {/* si hay error, el hint se oculta - un solo mensaje de ayuda a la vez, no se amontonan */}
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
