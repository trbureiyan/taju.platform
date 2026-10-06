import { Check } from 'lucide-react'
import { m } from 'motion/react'
import { useMedia } from '../../hooks/useMedia'
import { fechaEnPalabras, relojBogota } from '../../lib/horario'
import { resorte } from '../../lib/movimiento'

/**
 * Constancia de la cuenta: se llena mientras la persona escribe. Es decoración: va oculta a lectores de pantalla
 * (el lector ya anuncia cada campo) y solo la confirmación final se anuncia, en un role=status aparte.
 * @prop modo - 'registro' muestra nombre, correo, fecha y contraseña; 'ingreso' es sobrio y solo refleja el correo.
 * @prop nombre - Solo registro. En ingreso se ignora: mostrar el nombre de una cuenta existente filtraría qué correos tienen cuenta.
 * @prop contrasenaDefinida - La contraseña llegó al mínimo. Nunca se recibe ni se muestra el valor.
 * @prop confirmada - La cuenta se creó: las líneas se completan y se anuncia el éxito.
 * @prop ahora - Reloj inyectable para pruebas; la fecha siempre es la de Bogotá.
 */
interface ConstanciaProps {
  modo: 'registro' | 'ingreso'
  nombre?: string
  correo?: string
  contrasenaDefinida?: boolean
  confirmada?: boolean
  ahora?: Date
}

const FRASES: Record<'registro' | 'ingreso', string[]> = {
  registro: [
    'El taller ve quién envía cada solicitud.',
    'Tus pedidos quedan en tu historial.',
    'Guardamos tu autorización con su fecha.',
  ],
  ingreso: ['Con tu cuenta sigues tus pedidos y envías solicitudes.'],
}

function Linea({ etiqueta, valor, reducido }: { etiqueta: string; valor: string | null; reducido: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs uppercase tracking-wide text-texto-secundario">{etiqueta}</dt>
      <dd className="flex items-start gap-2">
        {valor === null ? (
          // la atenuación nunca es la única señal: el texto dice que falta
          <span className="text-sm text-texto-secundario">Pendiente</span>
        ) : (
          <>
            <m.span
              initial={reducido ? false : { opacity: 0.4 }}
              animate={{ opacity: 1 }}
              transition={resorte('efectosRapido')}
              className="min-w-0 break-words text-base text-texto-principal"
            >
              {valor}
            </m.span>
            <Check aria-hidden="true" size={16} className="mt-1 shrink-0 text-contexto-texto" />
          </>
        )}
      </dd>
    </div>
  )
}

export function Constancia({
  modo,
  nombre = '',
  correo = '',
  contrasenaDefinida = false,
  confirmada = false,
  ahora,
}: ConstanciaProps) {
  const escritorio = useMedia('(min-width: 1024px)')
  const reducido = useMedia('(prefers-reduced-motion: reduce)')
  const hoy = fechaEnPalabras(relojBogota(ahora ?? new Date()).fecha)
  const nombreLimpio = nombre.trim()
  const correoLimpio = correo.trim()

  // fuera del bloque oculto y siempre montado: un role=status que aparece de golpe no se anuncia
  const estado = (
    <div role="status" className="text-sm font-medium text-texto-principal">
      {confirmada && 'Listo, tu cuenta quedó creada.'}
    </div>
  )

  if (!escritorio) {
    const texto =
      modo === 'registro'
        ? `${nombreLimpio ? `Cuenta a nombre de ${nombreLimpio}` : 'Tu cuenta quedará a tu nombre'} · ${hoy}`
        : `${correoLimpio ? `Ingresando con ${correoLimpio}` : 'Ingresa con tu correo'} · ${hoy}`
    return (
      <>
        <div
          aria-hidden="true"
          className="flex min-h-boton items-center rounded-tarjeta border-2 border-dashed border-borde-medio bg-superficie-calida px-4"
        >
          <span className="min-w-0 truncate text-sm text-texto-principal">{texto}</span>
        </div>
        {estado}
      </>
    )
  }

  return (
    <>
      <section
        aria-hidden="true"
        className="rounded-lg border-2 border-dashed border-borde-medio bg-superficie-calida p-6"
      >
        <h2 className="mb-4 text-h3 font-semibold text-texto-principal">
          {modo === 'registro' ? 'Constancia de tu cuenta' : 'Tu cuenta'}
        </h2>
        <dl className="flex flex-col gap-3">
          {modo === 'registro' && (
            <Linea etiqueta="Cuenta a nombre de" valor={nombreLimpio || null} reducido={reducido} />
          )}
          <Linea etiqueta="Correo" valor={correoLimpio || null} reducido={reducido} />
          <Linea etiqueta="Fecha" valor={hoy} reducido={reducido} />
          {modo === 'registro' && (
            <Linea etiqueta="Contraseña" valor={contrasenaDefinida ? 'Definida' : null} reducido={reducido} />
          )}
        </dl>
        <ul className="mt-4 flex flex-col gap-2 text-sm text-texto-secundario">
          {FRASES[modo].map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </section>
      {estado}
    </>
  )
}
