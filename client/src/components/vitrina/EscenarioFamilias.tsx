import { useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { m } from 'motion/react'
import type { PanInfo } from 'motion/react'
import { EnlaceBoton } from '../ui/EnlaceBoton'
import { useMedia } from '../../hooks/useMedia'
import { PiezaSilueta } from './PiezaSilueta'
import { TechText } from './TechText'
import { CONTENIDO_FAMILIAS, rutaFamilia } from './contenido'

const TOTAL = CONTENIDO_FAMILIAS.length
const dosCifras = (n: number) => String(n).padStart(2, '0')

// una familia a la vez con el indice siempre visible: el escenario da profundidad sin esconder opciones (Hick)
export function EscenarioFamilias() {
  const [activa, setActiva] = useState(0)
  const pestanas = useRef<(HTMLButtonElement | null)[]>([])
  const actual = CONTENIDO_FAMILIAS[activa]
  // en movil el escenario se desliza con el dedo; en escritorio manda el indice
  const escritorio = useMedia('(min-width: 1024px)')
  const reducir = useMedia('(prefers-reduced-motion: reduce)')
  const deslizable = !escritorio && !reducir

  function alSoltar(_: unknown, info: PanInfo) {
    // 64px: menos que eso es un toque que se movio, no una intencion de cambiar de familia
    if (info.offset.x < -64) setActiva((activa + 1) % TOTAL)
    else if (info.offset.x > 64) setActiva((activa - 1 + TOTAL) % TOTAL)
  }

  function mover(destino: number) {
    const i = (destino + TOTAL) % TOTAL
    setActiva(i)
    pestanas.current[i]?.focus()
  }

  // patron de pestañas WAI-ARIA con foco itinerante; acepta ambos ejes porque en movil el indice es horizontal
  function alTeclear(e: KeyboardEvent) {
    const acciones: Record<string, () => void> = {
      ArrowDown: () => mover(activa + 1),
      ArrowRight: () => mover(activa + 1),
      ArrowUp: () => mover(activa - 1),
      ArrowLeft: () => mover(activa - 1),
      Home: () => mover(0),
      End: () => mover(TOTAL - 1),
    }
    const accion = acciones[e.key]
    if (!accion) return
    e.preventDefault()
    accion()
  }

  return (
    <section
      aria-labelledby="escenario-titulo"
      className={['px-4 py-16 lg:py-24 transition-colors duration-lenta ease-estandar', actual.claseFondo].join(' ')}
    >
      <h2 id="escenario-titulo" className="sr-only">
        Lo que hacemos en el taller
      </h2>
      <div className="w-full max-w-contenedor mx-auto flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-12">
        <div
          role="tablist"
          aria-label="Familias de producto"
          aria-orientation="vertical"
          onKeyDown={alTeclear}
          className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible lg:gap-1 lg:w-48 lg:shrink-0"
        >
          {CONTENIDO_FAMILIAS.map((c, i) => {
            const seleccionada = i === activa
            return (
              <button
                key={c.familia}
                ref={(el) => {
                  pestanas.current[i] = el
                }}
                role="tab"
                id={`pestana-${c.familia}`}
                aria-selected={seleccionada}
                aria-controls="escenario-panel"
                tabIndex={seleccionada ? 0 : -1}
                onClick={() => setActiva(i)}
                className={[
                  'shrink-0 flex items-center gap-3 min-h-boton text-left transition-[background-color,transform] duration-normal ease-estandar active:scale-97',
                  // movil: chips en pildora (son filtros); escritorio: indice de texto con linea de tinta
                  'px-4 rounded-full border lg:px-0 lg:rounded-none lg:border-0',
                  seleccionada
                    ? 'bg-superficie-base border-borde-fuerte font-semibold lg:bg-transparent'
                    : 'border-borde-medio text-texto-secundario hover:text-texto-principal',
                ].join(' ')}
              >
                <span className="cifra text-sm">{dosCifras(i + 1)}</span>
                <span>{c.nombre}</span>
                <span
                  aria-hidden="true"
                  className={['hidden lg:block h-px bg-borde-fuerte', seleccionada ? 'w-8' : 'w-0'].join(' ')}
                />
              </button>
            )
          })}
        </div>

        <div
          role="tabpanel"
          id="escenario-panel"
          aria-labelledby={`pestana-${actual.familia}`}
          className="flex-1 flex flex-col gap-8 lg:flex-row lg:items-center"
        >
          <m.div
            drag={deslizable ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.4}
            onDragEnd={alSoltar}
            className="relative flex items-center justify-center h-64 lg:h-96 lg:w-1/2 touch-pan-y"
          >
            {/* mancha organica: el unico gesto curvo de la pagina, para un taller que corta curvas */}
            <svg viewBox="0 0 200 200" aria-hidden="true" className="absolute inset-0 m-auto h-full w-auto fill-superficie-base">
              <path d="M44 32C70 6 124 4 156 28c30 22 40 64 26 100-14 36-52 62-92 58-40-4-72-34-78-72-6-34 8-60 32-82Z" />
            </svg>
            {/* key por familia: remonta la pieza y repite el revelado del corte en cada cambio */}
            <div key={actual.familia} className="relative w-48 h-48 lg:w-64 lg:h-64 text-texto-principal animate-revelar">
              <PiezaSilueta silueta={actual.silueta} className="w-full h-full" />
            </div>
          </m.div>

          <div className="flex flex-col items-start gap-6 lg:w-1/2">
            <p className="cifra text-sm text-texto-secundario">
              {dosCifras(activa + 1)} / {dosCifras(TOTAL)}
            </p>
            <p className="text-h1 lg:text-display-2xl font-semibold text-texto-principal">
              {/* key por familia: cada cambio remonta la palabra y en tactil la vuelve a dibujar */}
              <TechText key={actual.familia} texto={actual.nombre} />
            </p>
            <p className="text-texto-principal">{actual.descripcion}</p>
            <EnlaceBoton to={rutaFamilia(actual.familia)} variante="secundario">
              {actual.cta}
            </EnlaceBoton>
          </div>
        </div>
      </div>

      <ul className="w-full max-w-contenedor mx-auto mt-12 pt-6 border-t border-borde-fuerte flex flex-wrap gap-x-8 gap-y-2 text-sm font-medium text-texto-principal">
        {actual.datos.map((d) => (
          <li key={d}>{d}</li>
        ))}
      </ul>
    </section>
  )
}
