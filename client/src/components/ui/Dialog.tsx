import { useEffect, useId, useRef, type ReactNode } from 'react'
import { m } from 'motion/react'
import { resorte } from '../../lib/movimiento'

const FOCALIZABLES =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

/**
 * Props del diálogo modal.
 * @prop abierto - Si está visible. Cerrado no pinta nada.
 * @prop titulo - Nombre accesible del diálogo, también su encabezado.
 * @prop onCerrar - Se llama con Escape o con un clic en el fondo; quien lo usa decide si cierra.
 * @prop children - Contenido y botones de acción, los arma quien lo usa.
 */
interface DialogProps {
  abierto: boolean
  titulo: string
  onCerrar: () => void
  children: ReactNode
}

export function Dialog({ abierto, titulo, onCerrar, children }: DialogProps) {
  const idTitulo = useId()
  const panel = useRef<HTMLDivElement>(null)
  // quien lo usa suele pasar una funcion nueva en cada render; guardarla en un ref evita volver a enfocar en cada uno
  const cerrar = useRef(onCerrar)
  useEffect(() => {
    cerrar.current = onCerrar
  })

  useEffect(() => {
    if (!abierto) return
    const quienAbrio = document.activeElement as HTMLElement | null
    const overflowPrevio = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panel.current?.focus()

    function alTeclear(e: KeyboardEvent) {
      if (e.key === 'Escape') return cerrar.current()
      if (e.key !== 'Tab') return
      const foco = panel.current?.querySelectorAll<HTMLElement>(FOCALIZABLES)
      if (!foco || foco.length === 0) return e.preventDefault()
      const primero = foco[0]
      const ultimo = foco[foco.length - 1]
      const activo = document.activeElement
      if (e.shiftKey && (activo === primero || activo === panel.current)) {
        e.preventDefault()
        ultimo.focus()
      } else if (!e.shiftKey && activo === ultimo) {
        e.preventDefault()
        primero.focus()
      }
    }

    document.addEventListener('keydown', alTeclear)
    return () => {
      document.removeEventListener('keydown', alTeclear)
      document.body.style.overflow = overflowPrevio
      quienAbrio?.focus()
    }
  }, [abierto])

  if (!abierto) return null

  return (
    <div className="fixed inset-0 z-modal flex items-end justify-center p-4 sm:items-center">
      <div
        data-testid="fondo-dialogo"
        aria-hidden="true"
        onClick={onCerrar}
        className="absolute inset-0 bg-superficie-invertida/40"
      />
      {/* espacial para posicion y escala (rebota), efectos para opacidad (sin rebote) */}
      <m.div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        tabIndex={-1}
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ default: resorte('espacialNormal'), opacity: resorte('efectosNormal') }}
        className="relative flex w-full max-w-md flex-col gap-4 rounded-tarjeta border border-borde-sutil bg-superficie-base p-6 shadow-tarjeta outline-none"
      >
        <h2 id={idTitulo} className="text-h3 font-semibold text-texto-principal">
          {titulo}
        </h2>
        {children}
      </m.div>
    </div>
  )
}
