import { useRef, useState, useEffect } from 'react'
import type { CSSProperties, PointerEvent } from 'react'
import { m, useInView, useReducedMotion } from 'motion/react'
import { useMedia } from '../../hooks/useMedia'
import { resorte } from '../../lib/movimiento'

// radio en px alrededor del cursor donde la letra se vuelve ruta de corte
const ALCANCE = 160

// contorno interrumpido por una mascara diagonal: el trazo punteado de la ruta de corte. La mascara solo usa el
// canal alfa, por eso el color del gradiente no importa; el trazo toma currentColor (tinta)
const ESTILO_TRAZO: CSSProperties = {
  color: 'transparent',
  WebkitTextStroke: '2px currentColor',
  WebkitMaskImage: 'repeating-linear-gradient(135deg, black 0 6px, transparent 6px 10px)',
  maskImage: 'repeating-linear-gradient(135deg, black 0 6px, transparent 6px 10px)',
}

/**
 * Palabra cuyas letras se vuelven ruta de corte cerca del cursor y se pueden arrastrar (vuelven con spring).
 * Nunca para el wordmark "TaJú" (Pautas §3.4): solo nombres de familia en Poppins.
 * @prop texto - La palabra; también es el nombre accesible.
 * @prop className - Tamaño y peso tipográfico.
 */
export function TechText({ texto, className = '' }: { texto: string; className?: string }) {
  const punteroFino = useMedia('(pointer: fine)')
  const reducir = useReducedMotion() ?? false
  const interactivo = punteroFino && !reducir
  // en tactil no hay cursor: la palabra se dibuja como trazo una vez al entrar en pantalla y se rellena
  const dibujoUnico = !punteroFino && !reducir

  const raiz = useRef<HTMLSpanElement>(null)
  const letras = useRef<(HTMLSpanElement | null)[]>([])
  const trazos = useRef<(HTMLSpanElement | null)[]>([])
  const visible = useInView(raiz, { once: true, amount: 0.6 })
  const [rellena, setRellena] = useState(false)

  useEffect(() => {
    // setState diferido a proposito: el trazo tiene que pintarse al menos un cuadro antes de rellenarse
    if (dibujoUnico && visible) {
      const id = requestAnimationFrame(() => setRellena(true))
      return () => cancelAnimationFrame(id)
    }
  }, [dibujoUnico, visible])

  function alMover(e: PointerEvent) {
    letras.current.forEach((letra, i) => {
      const trazo = trazos.current[i]
      if (!letra || !trazo) return
      const r = letra.getBoundingClientRect()
      const distancia = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2))
      const t = Math.max(0, 1 - distancia / ALCANCE)
      trazo.style.opacity = String(t)
      letra.style.color = t > 0.5 ? 'transparent' : ''
    })
  }

  function alSalir() {
    letras.current.forEach((letra, i) => {
      if (letra) letra.style.color = ''
      const trazo = trazos.current[i]
      if (trazo) trazo.style.opacity = '0'
    })
  }

  const opacidadTrazo = dibujoUnico && !rellena ? 1 : 0

  return (
    <span
      ref={raiz}
      className={['relative inline-block', className].join(' ')}
      onPointerMove={interactivo ? alMover : undefined}
      onPointerLeave={interactivo ? alSalir : undefined}
    >
      <span className="sr-only">{texto}</span>
      <span data-letras aria-hidden="true" className="inline-flex">
        {[...texto].map((caracter, i) => (
          <m.span
            key={i}
            drag={interactivo}
            dragSnapToOrigin
            dragElastic={0.6}
            dragTransition={{ bounceStiffness: 380, bounceDamping: 2 * 0.8 * Math.sqrt(380) }}
            transition={resorte('espacialNormal')}
            className={['relative inline-block select-none', interactivo ? 'cursor-grab active:cursor-grabbing' : ''].join(' ')}
          >
            <span
              ref={(el) => {
                letras.current[i] = el
              }}
              className="transition-colors duration-normal ease-estandar"
              style={
                dibujoUnico ? { color: rellena ? undefined : 'transparent', transitionDelay: `${i * 40}ms` } : undefined
              }
            >
              {caracter === ' ' ? ' ' : caracter}
            </span>
            <span
              data-trazo
              ref={(el) => {
                trazos.current[i] = el
              }}
              className="absolute inset-0 transition-opacity duration-lenta ease-estandar pointer-events-none"
              style={{
                ...ESTILO_TRAZO,
                opacity: opacidadTrazo,
                // al rellenarse en tactil, cada letra llega un poco despues que la anterior
                transitionDelay: dibujoUnico ? `${i * 40}ms` : undefined,
              }}
            >
              {caracter === ' ' ? ' ' : caracter}
            </span>
          </m.span>
        ))}
      </span>
    </span>
  )
}
