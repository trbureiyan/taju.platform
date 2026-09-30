import { useId } from 'react'
import type { LineaResumen } from '../../lib/resumenPedido'

/**
 * Hoja con el resumen de la solicitud. En escritorio es un panel lateral fijo con altura maxima y scroll interno,
 * para que tres imagenes y textos largos no lo saquen de la pantalla.
 * @prop lineas - Lineas del resumen; `valor: null` se muestra como "Pendiente".
 * @prop titulo - Titulo de la hoja.
 * @prop className - Clases extra del contenedor (por ejemplo para ocultarla en el momento 4).
 */
interface HojaResumenProps {
  lineas: LineaResumen[]
  titulo?: string
  className?: string
}

export function HojaResumen({ lineas, titulo = 'Tu solicitud', className = '' }: HojaResumenProps) {
  // useId: la hoja puede montarse mas de una vez en la pagina y el id del titulo no debe repetirse
  const idTitulo = useId()
  return (
    <section
      aria-labelledby={idTitulo}
      className={[
        'rounded-lg border-2 border-dashed border-borde-medio bg-superficie-calida p-6',
        'lg:sticky lg:top-24 lg:max-h-[calc(100dvh-var(--space-24))] lg:overflow-y-auto',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <h2 id={idTitulo} className="mb-4 text-h3 font-semibold text-texto-principal">
        {titulo}
      </h2>
      <dl className="flex flex-col gap-3">
        {lineas.map((l) => (
          <div key={l.clave} className="flex flex-col gap-1">
            <dt className="text-xs uppercase tracking-wide text-texto-secundario">{l.etiqueta}</dt>
            <dd className={l.valor === null ? 'text-sm text-texto-secundario' : 'break-words text-base text-texto-principal'}>
              {/* la atenuacion nunca es la unica señal: el texto dice que falta */}
              {l.valor ?? 'Pendiente'}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
