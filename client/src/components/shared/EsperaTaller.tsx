import { useEffect, useState } from 'react'

type Fase = 'nada' | 'esqueleto' | 'trazo' | 'largo'

/**
 * Props de la espera mientras la API responde.
 * @prop mensaje - Se anuncia a los 3 s de espera.
 * @prop mensajeLargo - Reemplaza al anterior a los 15 s, cuando lo mas probable es que Render este arrancando.
 */
interface EsperaTallerProps {
  mensaje?: string
  mensajeLargo?: string
}

// umbral de Doherty: por debajo de 400 ms un indicador de carga solo parpadea y se siente mas lento que nada
const MS_ESQUELETO = 400
const MS_TRAZO = 3000
const MS_LARGO = 15000

export function EsperaTaller({
  mensaje = 'Estamos preparando el catálogo',
  mensajeLargo = 'La primera visita del día tarda un poco más mientras el taller arranca. Ya casi.',
}: EsperaTallerProps) {
  const [fase, setFase] = useState<Fase>('nada')

  useEffect(() => {
    const timers = [
      setTimeout(() => setFase('esqueleto'), MS_ESQUELETO),
      setTimeout(() => setFase('trazo'), MS_TRAZO),
      setTimeout(() => setFase('largo'), MS_LARGO),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  const texto = fase === 'trazo' ? mensaje : fase === 'largo' ? mensajeLargo : ''

  return (
    <div className="flex flex-col items-center gap-6">
      {(fase === 'trazo' || fase === 'largo') && (
        <div data-testid="isotipo-trazo" aria-hidden="true" className="relative w-24 h-24">
          {/* la silueta tenue es el trazo; encima, la pieza se descubre detras de la linea del laser */}
          <img src="/brand/taju-isotipo.svg" alt="" className="absolute inset-0 w-full h-full opacity-25" />
          <img
            src="/brand/taju-isotipo.svg"
            alt=""
            className="absolute inset-0 w-full h-full animate-corte motion-reduce:animate-none"
          />
          <div className="absolute inset-0 animate-corte-linea motion-reduce:hidden">
            <span className="absolute inset-y-0 left-0 w-px bg-borde-fuerte" />
          </div>
        </div>
      )}

      {/* siempre montado: un role="status" que aparece de golpe no siempre se anuncia */}
      <p role="status" className="text-texto-secundario text-center">
        {texto}
      </p>

      {fase !== 'nada' && (
        <ul
          data-testid="esqueleto"
          aria-hidden="true"
          className="w-full grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        >
          {[0, 1, 2].map((i) => (
            <li key={i} className="rounded-tarjeta bg-superficie-hundida overflow-hidden">
              <div className="aspect-square" />
              <div className="p-4 flex flex-col gap-2">
                <div className="h-4 w-2/3 rounded-sm bg-borde-medio" />
                <div className="h-4 w-1/3 rounded-sm bg-borde-medio" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
