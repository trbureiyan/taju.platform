type Tamano = 'compacto' | 'grande'
type EstadoArco = 'cumplido' | 'activo' | 'pendiente'

/**
 * Progreso por momentos: un arco por paso, con el numero del paso al centro.
 * @prop paso - Paso actual, de 1 a `total`.
 * @prop total - Cantidad de pasos (4 en el formulario de pedido).
 * @prop titulo - Nombre del momento; entra en el texto accesible "Paso 2 de 4: titulo".
 * @prop tamano - 'compacto' (encabezado fijo del movil) o 'grande' (escritorio).
 */
interface AnilloProgresoProps {
  paso: number
  total?: number
  titulo: string
  tamano?: Tamano
}

// geometria en unidades del viewBox (100): el tamano real lo da la clase de la caja, no estos numeros
const RADIO = 42
const CIRCUNFERENCIA = 2 * Math.PI * RADIO

// el color no es la unica señal: el numero central y el texto accesible dicen en que paso va
const ESTILO_ARCO: Record<EstadoArco, string> = {
  cumplido: 'stroke-contexto',
  activo: 'stroke-accion',
  pendiente: 'stroke-borde-medio',
}

// [DECISION] liso por ahora: la onda del arco activo (M3 Expressive) se agrega solo si al verla en pantalla aporta;
// a 48 px se leeria como un trazo defectuoso. Agregarla no cambia esta interfaz.
export function AnilloProgreso({ paso, total = 4, titulo, tamano = 'compacto' }: AnilloProgresoProps) {
  const grosor = tamano === 'grande' ? 8 : 10
  // con extremos redondos cada arco sobresale grosor/2 por punta: el hueco debe superar el grosor para que quede aire visible
  const hueco = grosor + 4
  const tramo = CIRCUNFERENCIA / total
  const largo = tramo - hueco

  return (
    <div
      role="img"
      aria-label={`Paso ${paso} de ${total}: ${titulo}`}
      className={[
        'relative inline-flex shrink-0 items-center justify-center',
        tamano === 'grande' ? 'w-24 h-24' : 'w-12 h-12',
      ].join(' ')}
    >
      <svg viewBox="0 0 100 100" aria-hidden="true" className="w-full h-full -rotate-90">
        {Array.from({ length: total }, (_, i) => {
          const numero = i + 1
          const estado: EstadoArco = numero < paso ? 'cumplido' : numero === paso ? 'activo' : 'pendiente'
          return (
            <circle
              key={numero}
              data-estado={estado}
              cx="50"
              cy="50"
              r={RADIO}
              fill="none"
              strokeWidth={grosor}
              strokeLinecap="round"
              strokeDasharray={`${largo} ${CIRCUNFERENCIA - largo}`}
              strokeDashoffset={-i * tramo}
              className={[ESTILO_ARCO[estado], 'transition-[stroke] duration-normal ease-estandar motion-reduce:transition-none'].join(' ')}
            />
          )
        })}
      </svg>
      <span
        aria-hidden="true"
        className={['absolute font-semibold text-texto-principal tabular-nums', tamano === 'grande' ? 'text-h3' : 'text-sm'].join(' ')}
      >
        {paso}
      </span>
    </div>
  )
}
