import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { m } from 'motion/react'
import { resorte } from '../../lib/movimiento'

/**
 * Opciones de un aviso.
 * @prop accion - Un solo botón de texto, ej. "Deshacer". Alarga la duración del aviso.
 * @prop tono - 'error' para fallos; el aviso usa el mismo contenedor, pero el mensaje explica qué hacer.
 */
export interface OpcionesAviso {
  accion?: { etiqueta: string; alHacerClick: () => void }
  tono?: 'neutro' | 'error'
}

interface Aviso extends OpcionesAviso {
  id: number
  mensaje: string
}

interface ContextoSnackbar {
  avisar: (mensaje: string, opciones?: OpcionesAviso) => void
}

const Contexto = createContext<ContextoSnackbar | null>(null)

const DURACION_MS = 5000
const DURACION_CON_ACCION_MS = 8000

/** Proveedor del aviso de una línea (M3 snackbar): confirma una acción sin sacar al usuario de lo que hace. */
export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [aviso, setAviso] = useState<Aviso | null>(null)
  const temporizador = useRef<number | undefined>(undefined)
  const contador = useRef(0)

  const cerrar = useCallback(() => {
    window.clearTimeout(temporizador.current)
    setAviso(null)
  }, [])

  const avisar = useCallback((mensaje: string, opciones: OpcionesAviso = {}) => {
    window.clearTimeout(temporizador.current)
    contador.current += 1
    setAviso({ id: contador.current, mensaje, ...opciones })
    temporizador.current = window.setTimeout(
      () => setAviso(null),
      opciones.accion ? DURACION_CON_ACCION_MS : DURACION_MS,
    )
  }, [])

  useEffect(() => () => window.clearTimeout(temporizador.current), [])

  const valor = useMemo(() => ({ avisar }), [avisar])
  const accion = aviso?.accion

  return (
    <Contexto.Provider value={valor}>
      {children}
      {/* la region viva queda siempre en el DOM: un lector de pantalla anuncia lo que entra en ella */}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-24 z-aviso mx-auto max-w-md lg:bottom-6"
      >
        {aviso && (
          <m.div
            key={aviso.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ default: resorte('espacialNormal'), opacity: resorte('efectosNormal') }}
            className="pointer-events-auto flex items-center gap-3 rounded-boton bg-superficie-invertida px-4 py-3 text-sm text-texto-invertido shadow-lg"
          >
            <p className="flex-1">{aviso.mensaje}</p>
            {accion && (
              <button
                type="button"
                onClick={() => {
                  accion.alHacerClick()
                  cerrar()
                }}
                className="min-h-boton shrink-0 rounded-boton px-3 font-medium underline underline-offset-4 focus-visible:outline-none focus-visible:shadow-foco"
              >
                {accion.etiqueta}
              </button>
            )}
          </m.div>
        )}
      </div>
    </Contexto.Provider>
  )
}

/** @throws Error si se usa fuera de `SnackbarProvider`: un aviso que nadie pinta seria un fallo silencioso. */
export function useSnackbar(): ContextoSnackbar {
  const contexto = useContext(Contexto)
  if (!contexto) throw new Error('useSnackbar se usa dentro de SnackbarProvider')
  return contexto
}
