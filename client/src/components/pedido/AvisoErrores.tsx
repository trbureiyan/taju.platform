import type { Errores } from '../../lib/validarSolicitud'

/**
 * Un solo aviso por momento (role="alert") en lugar de una alerta por campo; cada campo marcado sigue enlazado a
 * su propio mensaje por aria-describedby.
 */
export function AvisoErrores({ errores }: { errores: Errores }) {
  const cantidad = Object.values(errores).filter(Boolean).length
  if (cantidad === 0) return null
  return (
    <div role="alert" className="rounded-tarjeta border border-error-borde bg-error-fondo p-3">
      <p className="text-sm text-error-texto">
        {cantidad === 1
          ? 'Nos falta revisar un dato para continuar. Está marcado abajo.'
          : `Nos faltan por revisar ${cantidad} datos para continuar. Están marcados abajo.`}
      </p>
    </div>
  )
}
