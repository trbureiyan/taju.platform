import { useState } from 'react'
import { Pause, Play } from 'lucide-react'

const PRODUCTOS = ['cake toppers', 'blondas', 'letreros', 'invitaciones', 'llaveros', 'letras en vinilo', 'bases']

function Tramo() {
  return (
    <span className="flex items-center gap-6 pr-6 shrink-0">
      {PRODUCTOS.map((p) => (
        <span key={p} className="flex items-center gap-6">
          <span>{p}</span>
          <span className="w-2 h-2 rounded-full bg-borde-fuerte" />
        </span>
      ))}
    </span>
  )
}

// costura entre el hero y el escenario: ritmo, no informacion - por eso no tiene enlaces ni se lee con lector de pantalla
export function Cinta() {
  const [pausada, setPausada] = useState(false)
  // hover y foco dentro pausan temporalmente; el boton es la pausa que cumple WCAG 2.2.2 en teclado y tactil
  const [enPausaTemporal, setEnPausaTemporal] = useState(false)
  const detenida = pausada || enPausaTemporal

  return (
    <div
      // -my-4 y z-elevado: la banda inclinada se monta sobre el hero y el escenario para no dejar cuñas de fondo
      className="relative z-elevado -my-4 bg-contexto text-contexto-texto -rotate-1 overflow-hidden py-3 flex items-center"
      onMouseEnter={() => setEnPausaTemporal(true)}
      onMouseLeave={() => setEnPausaTemporal(false)}
      onFocus={() => setEnPausaTemporal(true)}
      onBlur={() => setEnPausaTemporal(false)}
    >
      <div
        data-testid="cinta-pista"
        aria-hidden="true"
        className="flex w-max font-semibold uppercase text-lg animate-cinta motion-reduce:animate-none"
        style={{ animationPlayState: detenida ? 'paused' : 'running' }}
      >
        <Tramo />
        <Tramo />
      </div>
      {/* a la izquierda: a la derecha choca con el WhatsApp flotante */}
      <button
        type="button"
        onClick={() => {
          setPausada((p) => !p)
          // quien toca "Reanudar" con el cursor encima espera ver movimiento ya, no al salir de la cinta
          setEnPausaTemporal(false)
        }}
        aria-label={pausada ? 'Reanudar la cinta' : 'Pausar la cinta'}
        className="absolute left-4 flex items-center justify-center h-boton aspect-square rounded-full bg-superficie-base text-texto-principal border border-borde-fuerte transition-transform duration-normal ease-estandar active:scale-97 motion-reduce:hidden"
      >
        {pausada ? <Play aria-hidden="true" size={18} /> : <Pause aria-hidden="true" size={18} />}
      </button>
    </div>
  )
}
