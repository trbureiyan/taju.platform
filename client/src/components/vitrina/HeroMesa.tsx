import { m } from 'motion/react'
import { EnlaceBoton } from '../ui/EnlaceBoton'
import { resorte } from '../../lib/movimiento'
import { PiezaSilueta } from './PiezaSilueta'
import type { Silueta } from './PiezaSilueta'

interface Pieza {
  silueta: Silueta
  fondo: string
  // grados; lo aplica motion y no una clase, porque motion reescribe transform al animar
  giro: number
}

// sin fondo hielo: se perderia contra el fondo del hero, que es hielo
// posiciones fijas, nada al azar: el layout no salta entre cargas y los tests son deterministas
const IZQUIERDA: Pieza[] = [
  { silueta: 'topper', fondo: 'bg-familia-toppers', giro: -6 },
  { silueta: 'letras', fondo: 'bg-familia-senaletica', giro: 3 },
  { silueta: 'caja', fondo: 'bg-superficie-base', giro: -3 },
]
const DERECHA: Pieza[] = [
  { silueta: 'blonda', fondo: 'bg-familia-superficies', giro: 6 },
  { silueta: 'pase', fondo: 'bg-superficie-base', giro: -2 },
  { silueta: 'llavero', fondo: 'bg-familia-toppers', giro: 3 },
]
// en movil solo cabe una tira de cuatro sobre la tarjeta
const MOVIL: Pieza[] = [IZQUIERDA[0], DERECHA[0], IZQUIERDA[1], DERECHA[1]]

// la tarjeta central entra primero (animate-aparecer); las piezas caen despues, escalonadas
const RETRASO_INICIAL = 0.15
const ESCALON = 0.06

function Tarjeta({ pieza, tamano, orden }: { pieza: Pieza; tamano: string; orden: number }) {
  return (
    <m.div
      initial={{ y: -96, opacity: 0, rotate: 0 }}
      animate={{ y: 0, opacity: 1, rotate: pieza.giro }}
      transition={{ ...resorte('espacialNormal'), delay: RETRASO_INICIAL + orden * ESCALON }}
      // al hover la pieza se endereza y se eleva; no empuja a sus vecinas, seria movimiento sin informacion
      whileHover={{ rotate: 0, y: -4, transition: resorte('espacialRapido') }}
      className={['shrink-0 rounded-tarjeta p-4 text-texto-principal shadow-tarjeta', pieza.fondo, tamano].join(' ')}
    >
      <PiezaSilueta silueta={pieza.silueta} className="w-full h-full" />
    </m.div>
  )
}

export function HeroMesa() {
  return (
    <section aria-labelledby="hero-titulo" className="bg-superficie-fria overflow-hidden px-4 py-12 lg:py-16">
      <div data-testid="piezas" aria-hidden="true" className="flex gap-4 justify-center -mx-8 mb-8 lg:hidden">
        {MOVIL.map((p, i) => (
          <Tarjeta key={i} pieza={p} tamano="w-24 h-24" orden={i} />
        ))}
      </div>

      <div className="w-full max-w-contenedor mx-auto flex items-center justify-center gap-12">
        <div aria-hidden="true" className="hidden lg:flex flex-col gap-8">
          {IZQUIERDA.map((p, i) => (
            <Tarjeta key={i} pieza={p} tamano="w-32 h-32" orden={i * 2} />
          ))}
        </div>

        <div className="relative w-full max-w-2xl animate-aparecer">
          {/* la unica aparicion del rosa en pantalla: una pieza asomando por la esquina de la tarjeta */}
          <m.div
            aria-hidden="true"
            initial={{ y: -96, opacity: 0, rotate: 0 }}
            animate={{ y: 0, opacity: 1, rotate: 12 }}
            transition={{ ...resorte('espacialLento'), delay: RETRASO_INICIAL + 6 * ESCALON }}
            className="hidden lg:block absolute -top-8 -right-8 w-24 h-24 rounded-tarjeta p-3 bg-acento text-texto-principal shadow-tarjeta"
          >
            <PiezaSilueta silueta="corazon" className="w-full h-full" />
          </m.div>

          <div className="bg-superficie-elevada rounded-lg shadow-md p-8 lg:p-12 flex flex-col items-start gap-6">
            <img src="/brand/taju-imagotipo.svg" alt="TaJú" className="w-44 h-16 object-cover" />
            <h1 id="hero-titulo" className="text-h1 lg:text-display-xl text-texto-principal">
              Te ayudamos a pedir bien para que salga bien.
            </h1>
            <p className="text-lg text-texto-secundario">
              Toppers, blondas, letreros y papelería cortados en láser en Neiva. Te guiamos con las medidas antes de
              producir.
            </p>
            <EnlaceBoton to="/catalogo">Ver el catálogo</EnlaceBoton>
            <p className="text-sm text-texto-secundario">
              ¿Compras para tu repostería o tu negocio?{' '}
              {/* ancla nativa: el Link del router no hace scroll a un hash */}
              <a
                href="#por-volumen"
                className="inline-flex items-center min-h-boton font-medium text-texto-principal underline underline-offset-4"
              >
                Ver precios por volumen →
              </a>
            </p>
          </div>
        </div>

        <div aria-hidden="true" className="hidden lg:flex flex-col gap-8">
          {DERECHA.map((p, i) => (
            <Tarjeta key={i} pieza={p} tamano="w-32 h-32" orden={i * 2 + 1} />
          ))}
        </div>
      </div>
    </section>
  )
}
