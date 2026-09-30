import { useId, useMemo } from 'react'
import { Input } from '../ui/Input'
import { diasConServicio, fechaEnPalabras, primerDiaDisponible } from '../../lib/horario'
import { validarFechaDeseada } from '../../lib/fechaDeseada'

const CANTIDAD_DE_DIAS = 14

/**
 * Elige el dia en que el cliente necesita su pedido. Lista solo dias con servicio (sin celdas grises) desde el
 * primer dia realmente disponible; "otra fecha" cubre cualquier otro dia y explica si no hay servicio.
 * @prop valor - Fecha elegida `YYYY-MM-DD`, o vacio.
 * @prop onCambio - Recibe la fecha elegida.
 * @prop ahora - Momento actual (se inyecta en los tests).
 * @prop error - Error de validacion del momento.
 */
interface TiraDiasProps {
  valor: string
  onCambio: (fecha: string) => void
  ahora?: Date
  error?: string
}

function partes(fecha: string): { semana: string; dia: string; mes: string } {
  const d = new Date(`${fecha}T12:00:00-05:00`)
  const formato = (o: Intl.DateTimeFormatOptions) => d.toLocaleDateString('es-CO', { ...o, timeZone: 'America/Bogota' })
  return {
    semana: formato({ weekday: 'short' }).replace('.', ''),
    dia: String(Number(fecha.slice(8, 10))),
    mes: formato({ month: 'short' }).replace('.', ''),
  }
}

export function TiraDias({ valor, onCambio, ahora, error }: TiraDiasProps) {
  const id = useId()
  const momento = ahora ?? new Date()
  const minimo = primerDiaDisponible(momento)
  const dias = useMemo(() => diasConServicio(minimo, CANTIDAD_DE_DIAS), [minimo])
  const enLaTira = dias.includes(valor)
  // una fecha fuera de la tira (o invalida) se ve y se explica en "otra fecha"
  const errorOtra = valor && !enLaTira ? validarFechaDeseada(valor, momento) : null
  const mensaje = error ?? errorOtra ?? undefined

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-medium text-texto-principal">Día en que la necesitas</legend>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {dias.map((fecha) => {
          const p = partes(fecha)
          const marcado = valor === fecha
          return (
            <label key={fecha} className="relative shrink-0 cursor-pointer">
              <input
                type="radio"
                name={`${id}-dia`}
                value={fecha}
                checked={marcado}
                aria-label={fechaEnPalabras(fecha)}
                onChange={() => onCambio(fecha)}
                className="peer sr-only"
              />
              <span
                className={[
                  'flex min-h-boton w-16 flex-col items-center justify-center rounded-lg border-2 p-2',
                  'transition-[border-color,background-color,transform] duration-normal ease-estandar active:scale-97',
                  'peer-focus-visible:shadow-foco',
                  marcado ? 'border-accion bg-superficie-calida' : 'border-borde-medio bg-campo-fondo hover:border-borde-fuerte',
                ].join(' ')}
              >
                <span className="text-xs uppercase text-texto-secundario">{p.semana}</span>
                <span className="text-lg font-semibold text-texto-principal tabular-nums">{p.dia}</span>
                <span className="text-xs text-texto-secundario">{p.mes}</span>
              </span>
            </label>
          )
        })}
      </div>
      {/* texto fijo de la tabla actual: revisarlo si cambian HORARIO_SEMANAL o CIERRES_ADICIONALES (lib/politicas.ts) */}
      <p className="text-xs text-texto-secundario">No hay servicio los domingos ni los lunes festivos.</p>
      <Input
        label="Otra fecha"
        type="date"
        min={minimo}
        value={enLaTira ? '' : valor}
        onChange={(e) => onCambio(e.target.value)}
        error={mensaje}
        anunciarError={false}
      />
    </fieldset>
  )
}
