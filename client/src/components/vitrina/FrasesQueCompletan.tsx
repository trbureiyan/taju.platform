import { useRef, useState } from 'react'
import { m, useScroll, useMotionValueEvent } from 'motion/react'
import { EnlaceBoton } from '../ui/EnlaceBoton'
import { useMedia } from '../../hooks/useMedia'
import { resorte } from '../../lib/movimiento'

// los mismos datos que pide el formulario de pedido: la Vitrina enseña a pedir antes de pedir
const COMPLETAN = [
  'el diámetro de tu torta, de borde a borde.',
  'la altura, desde la base hasta arriba.',
  'el nombre y la edad, tal como los quieres ver.',
  'la fecha de tu celebración.',
]

export function FrasesQueCompletan() {
  const escritorio = useMedia('(min-width: 1024px)')
  const reducir = useMedia('(prefers-reduced-motion: reduce)')
  // en movil no se fija: varias pantallas de scroll atrapado con el pulgar se sienten como una pagina que no avanza
  const fijo = escritorio && !reducir

  const recorrido = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: recorrido, offset: ['start start', 'end end'] })
  const [activa, setActiva] = useState(0)
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    setActiva(Math.min(COMPLETAN.length - 1, Math.floor(v * COMPLETAN.length)))
  })

  return (
    <section
      ref={recorrido}
      aria-labelledby="frases-titulo"
      className="bg-superficie-base px-4"
      // una pantalla de recorrido por frase: el contenido queda fijo mientras se completan
      style={fijo ? { height: `${COMPLETAN.length * 100}vh` } : undefined}
    >
      <div
        className={[
          'w-full max-w-contenedor mx-auto grid gap-8 lg:grid-cols-2 lg:gap-12',
          fijo ? 'sticky top-0 h-screen content-center' : 'py-24',
        ].join(' ')}
      >
        <div className="flex flex-col gap-6">
          <h2 id="frases-titulo" className="text-h2 text-texto-principal">
            Para que tu topper salga bien, necesitamos…
          </h2>
          {fijo && (
            <div aria-hidden="true" className="h-px bg-borde-sutil">
              <m.div className="h-px bg-borde-fuerte origin-left" style={{ scaleX: scrollYProgress }} />
            </div>
          )}
        </div>

        <div className="flex flex-col items-start gap-8">
          {/* en el DOM siempre es una lista comun: el efecto fijo es solo visual, sin aria-live */}
          <ul className={fijo ? 'relative w-full h-24' : 'flex flex-col gap-4'}>
            {COMPLETAN.map((f, i) => (
              <m.li
                key={f}
                className={['text-h3 font-semibold text-texto-principal', fijo ? 'absolute inset-x-0 top-0' : ''].join(' ')}
                initial={fijo ? false : { opacity: 0, y: 8 }}
                animate={
                  fijo
                    ? {
                        opacity: i === activa ? 1 : 0,
                        scale: i === activa ? 1 : 0.96,
                        filter: i === activa ? 'blur(0px)' : 'blur(6px)',
                      }
                    : undefined
                }
                whileInView={fijo ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.8 }}
                transition={resorte('efectosNormal')}
              >
                {f}
              </m.li>
            ))}
          </ul>
          <p className="text-lg text-texto-secundario">Con eso, sale bien.</p>
          <EnlaceBoton to="/catalogo">Ver el catálogo</EnlaceBoton>
        </div>
      </div>
    </section>
  )
}
