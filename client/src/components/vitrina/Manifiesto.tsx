import { useRef } from 'react'
import { m, useScroll, useTransform } from 'motion/react'
import type { MotionValue } from 'motion/react'
import { useMedia } from '../../hooks/useMedia'

const FRASE = 'Cortamos y grabamos cada pieza en nuestro taller, en Neiva.'
const PALABRAS = FRASE.split(' ')

function Palabra({ texto, progreso, rango }: { texto: string; progreso: MotionValue<number>; rango: [number, number] }) {
  // opacidad y no color: la palabra "sin revelar" es la misma tinta atenuada, sin inventar un tono intermedio
  const opacity = useTransform(progreso, rango, [0.25, 1])
  return <m.span style={{ opacity }}>{texto} </m.span>
}

// el Artesano habla de su oficio: una sola frase, sin nombres ni fotos (Quienes somos sigue fuera del alcance)
export function Manifiesto() {
  const seccion = useRef<HTMLElement>(null)
  const reducir = useMedia('(prefers-reduced-motion: reduce)')
  // termina a mitad de pantalla y no al salir: nadie debe quedarse leyendo la frase a medio contraste
  const { scrollYProgress } = useScroll({ target: seccion, offset: ['start 0.85', 'center 0.5'] })

  return (
    <section ref={seccion} aria-labelledby="manifiesto-titulo" className="bg-superficie-calida px-4 py-24">
      <div className="w-full max-w-contenedor mx-auto flex flex-col gap-4">
        <p className="text-sm font-medium uppercase text-texto-secundario">Nuestro taller</p>
        <h2 id="manifiesto-titulo" className="text-h1 max-w-prosa text-texto-principal">
          {reducir
            ? FRASE
            : PALABRAS.map((p, i) => (
                <Palabra
                  key={i}
                  texto={p}
                  progreso={scrollYProgress}
                  rango={[i / PALABRAS.length, (i + 1) / PALABRAS.length]}
                />
              ))}
        </h2>
      </div>
    </section>
  )
}
