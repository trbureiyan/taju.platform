export type Silueta = 'topper' | 'blonda' | 'letras' | 'pase' | 'llavero' | 'caja' | 'corazon'

// ruta de corte: trazo punteado de 2px, el mismo grosor de Lucide - hoy es el placeholder, mañana la foto
const TRAZO = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeDasharray: '6 4',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

/**
 * Silueta de una pieza dibujada como ruta de corte, hecha solo con Poppins y geometría.
 * @prop silueta - Qué pieza dibujar.
 * @prop className - Tamaño y color (el trazo usa currentColor).
 */
export function PiezaSilueta({ silueta, className = '' }: { silueta: Silueta; className?: string }) {
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true" className={className}>
      {silueta === 'topper' && (
        <>
          <text x="60" y="70" textAnchor="middle" fontFamily="var(--fuente-base)" fontWeight="600" fontSize="64" {...TRAZO}>
            15
          </text>
          <path d="M44 78 V112 M76 78 V112" {...TRAZO} />
        </>
      )}
      {silueta === 'blonda' && (
        <>
          <circle cx="60" cy="60" r="52" {...TRAZO} />
          <circle cx="60" cy="60" r="40" {...TRAZO} />
          <circle cx="60" cy="60" r="26" {...TRAZO} />
        </>
      )}
      {silueta === 'letras' && (
        <text x="60" y="78" textAnchor="middle" fontFamily="var(--fuente-base)" fontWeight="600" fontSize="56" {...TRAZO}>
          Aa
        </text>
      )}
      {silueta === 'pase' && (
        <>
          <rect x="22" y="14" width="76" height="92" rx="8" {...TRAZO} />
          <circle cx="60" cy="30" r="5" {...TRAZO} />
          <text x="60" y="76" textAnchor="middle" fontFamily="var(--fuente-base)" fontWeight="600" fontSize="26" {...TRAZO}>
            VIP
          </text>
        </>
      )}
      {silueta === 'llavero' && (
        <>
          <circle cx="60" cy="24" r="12" {...TRAZO} />
          <rect x="34" y="40" width="52" height="66" rx="12" {...TRAZO} />
        </>
      )}
      {silueta === 'caja' && (
        <>
          <rect x="22" y="44" width="76" height="60" rx="4" {...TRAZO} />
          <path d="M16 44 H104 V30 H16 Z M60 30 V104" {...TRAZO} />
        </>
      )}
      {silueta === 'corazon' && (
        <path d="M60 104 C20 76 10 52 26 34 C40 20 56 28 60 40 C64 28 80 20 94 34 C110 52 100 76 60 104 Z" {...TRAZO} />
      )}
    </svg>
  )
}
