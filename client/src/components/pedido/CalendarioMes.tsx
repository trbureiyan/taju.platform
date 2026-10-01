import { useId, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { esDiaConServicio, fechaEnPalabras, primerDiaDisponible } from '../../lib/horario'

// [DECISION] hasta un año adelante: un pedido para más allá casi siempre se habla por WhatsApp. Cambiar el tope es
// tocar esta constante.
const MESES_ADELANTE = 12
const DIAS_SEMANA = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom']

function iso(anio: number, mes: number, dia: number): string {
  return `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

// meses como número absoluto (año * 12 + mes) para compararlos y navegar sin casos de borde de diciembre
const absoluto = (anio: number, mes: number) => anio * 12 + mes
const mesDe = (fecha: string) => absoluto(Number(fecha.slice(0, 4)), Number(fecha.slice(5, 7)) - 1)

/**
 * Calendario de un mes para elegir la fecha deseada. Solo se pueden elegir días con servicio y desde el primer día
 * disponible; los demás se ven en gris (la leyenda lo explica). Semana de lunes a domingo.
 * @prop valor - Fecha elegida `YYYY-MM-DD`, o vacío.
 * @prop onCambio - Recibe la fecha elegida.
 * @prop ahora - Momento actual (se inyecta en los tests).
 */
interface CalendarioMesProps {
  valor: string
  onCambio: (fecha: string) => void
  ahora?: Date
}

const BOTON_NAV =
  'flex h-boton w-boton items-center justify-center rounded-boton text-texto-principal hover:bg-superficie-elevada disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:shadow-foco'

export function CalendarioMes({ valor, onCambio, ahora }: CalendarioMesProps) {
  const idTitulo = useId()
  const minimo = primerDiaDisponible(ahora ?? new Date())
  const mesMinimo = mesDe(minimo)
  const [vista, setVista] = useState(mesDe(valor && valor >= minimo ? valor : minimo))

  const anio = Math.floor(vista / 12)
  const mes = vista % 12
  const totalDias = new Date(Date.UTC(anio, mes + 1, 0)).getUTCDate()
  // lunes = 0: getUTCDay() devuelve 0 para el domingo
  const huecos = (new Date(Date.UTC(anio, mes, 1)).getUTCDay() + 6) % 7
  const titulo = new Date(Date.UTC(anio, mes, 1, 12)).toLocaleDateString('es-CO', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })

  return (
    <div className="flex flex-col gap-3 rounded-tarjeta border border-borde-sutil bg-superficie-base p-4">
      <div className="flex items-center justify-between">
        <button type="button" aria-label="Mes anterior" disabled={vista <= mesMinimo} onClick={() => setVista(vista - 1)} className={BOTON_NAV}>
          <ChevronLeft aria-hidden="true" size={20} />
        </button>
        <p id={idTitulo} aria-live="polite" className="text-base font-medium capitalize text-texto-principal">
          {titulo}
        </p>
        <button type="button" aria-label="Mes siguiente" disabled={vista >= mesMinimo + MESES_ADELANTE} onClick={() => setVista(vista + 1)} className={BOTON_NAV}>
          <ChevronRight aria-hidden="true" size={20} />
        </button>
      </div>

      <div role="grid" aria-labelledby={idTitulo} className="grid grid-cols-7 gap-1">
        {DIAS_SEMANA.map((d) => (
          <span key={d} role="columnheader" className="text-center text-xs uppercase text-texto-secundario">
            {d}
          </span>
        ))}
        {Array.from({ length: huecos }, (_, i) => (
          <span key={`h${i}`} role="gridcell" aria-hidden="true" />
        ))}
        {Array.from({ length: totalDias }, (_, i) => {
          const fecha = iso(anio, mes, i + 1)
          const disponible = fecha >= minimo && esDiaConServicio(fecha)
          const elegido = fecha === valor
          return (
            <span key={fecha} role="gridcell" className="flex justify-center">
              <button
                type="button"
                disabled={!disponible}
                aria-pressed={elegido}
                aria-label={fechaEnPalabras(fecha)}
                onClick={() => onCambio(fecha)}
                className={[
                  'h-boton w-full rounded-boton text-base tabular-nums transition-[background-color,transform] duration-normal ease-estandar active:scale-97',
                  'focus-visible:outline-none focus-visible:shadow-foco',
                  elegido
                    ? 'bg-accion font-semibold text-accion-texto'
                    : disponible
                      ? 'text-texto-principal hover:bg-superficie-elevada'
                      : 'cursor-not-allowed text-texto-deshabilitado',
                ].join(' ')}
              >
                {i + 1}
              </button>
            </span>
          )
        })}
      </div>

      <p className="text-xs text-texto-secundario">
        Los días en gris no tienen servicio: domingos, lunes festivos y fechas anteriores al primer día disponible.
      </p>
    </div>
  )
}
