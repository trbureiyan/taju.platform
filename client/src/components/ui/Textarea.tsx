import { forwardRef, useId } from 'react'

// nota: aqui se llama "ayuda", en Input.tsx el mismo concepto se llama "hint" - nombres distintos, mismo rol

/**
 * Props del campo de texto multilínea.
 * @prop label - Etiqueta visible del campo.
 * @prop error - Mensaje de error; cuando presente, aria-invalid se activa y se muestra en lugar del texto de ayuda.
 * @prop ayuda - Texto de ayuda; se oculta si hay error activo.
 * @prop rows - Número de filas visibles del textarea; por defecto 4.
 */
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  ayuda?: string
  rows?: number
}

// forwardRef porque react-hook-form (o similar) necesita enganchar el ref directo al textarea
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, ayuda, rows = 4, className, id: idExterno, ...props }, ref) => {
    const idGenerado = useId() // React genera el id, evita colisiones si el mismo formulario repite el componente
    // si el caller pasa id, se respeta; si no, se usa el generado — igual que Input.tsx
    const id = idExterno ?? idGenerado
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
