import { forwardRef, useId } from 'react'

// nota: aqui se llama "ayuda", en Input.tsx el mismo concepto se llama "hint" - nombres distintos, mismo rol
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  ayuda?: string
  rows?: number
}

// forwardRef porque react-hook-form (o similar) necesita enganchar el ref directo al textarea
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, ayuda, rows = 4, className, ...props }, ref) => {
    const id = useId() // React genera el id, evita colisiones si el mismo formulario repite el componente
    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="text-sm font-medium text-campo-etiqueta">
          {label}
        </label>
        <textarea
          ref={ref}
          id={id}
          rows={rows}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            error ? `${id}-error` : ayuda ? `${id}-ayuda` : undefined
          }
          className={[
            'w-full px-3 py-2 text-sm rounded-campo border bg-campo-fondo text-campo-texto',
            'placeholder:text-campo-marcador transition-colors resize-y',
            'focus-visible:outline-none focus-visible:shadow-foco',
            error
              ? 'border-error-borde'
              : 'border-borde-defecto hover:border-borde-activo',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />
        {error && (
          <p id={`${id}-error`} role="alert" className="text-xs text-error-texto">
            {error}
          </p>
        )}
        {!error && ayuda && (
          <p id={`${id}-ayuda`} className="text-xs text-campo-ayuda">
            {ayuda}
          </p>
        )}
      </div>
    )
  },
)
Textarea.displayName = 'Textarea'
