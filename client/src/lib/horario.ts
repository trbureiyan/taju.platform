import {
  CIERRES_ADICIONALES,
  HORARIO_SEMANAL,
  MARGEN_ULTIMA_ENTREGA_HORAS,
  PLAZO_CONTACTO_HORAS,
  esFestivo,
} from './politicas'

const ZONA = 'America/Bogota'
const MINUTO_MS = 60_000
const HORA_MS = 60 * MINUTO_MS
const DIA_MS = 24 * HORA_MS

const formatoBogota = new Intl.DateTimeFormat('en-US', {
  timeZone: ZONA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  weekday: 'short',
  hour: 'numeric',
  minute: 'numeric',
  hourCycle: 'h23',
})
const DIAS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/**
 * Dia, minutos y fecha en la hora de Colombia, sin importar la zona del dispositivo.
 * @returns `dia` como `getDay()` (0 domingo a 6 sabado), `minutos` de 0 a 1439 y `fecha` como `YYYY-MM-DD`.
 */
export function relojBogota(fecha: Date): { dia: number; minutos: number; fecha: string } {
  const partes = Object.fromEntries(formatoBogota.formatToParts(fecha).map((p) => [p.type, p.value]))
  return {
    dia: DIAS.indexOf(partes.weekday),
    minutos: Number(partes.hour) * 60 + Number(partes.minute),
    fecha: `${partes.year}-${partes.month}-${partes.day}`,
  }
}

/** @returns Ej. `8:00 a. m.`, `6:00 p. m.` */
export function horaEnPalabras(hora: number): string {
  const sufijo = hora < 12 ? 'a. m.' : 'p. m.'
  const en12 = hora % 12 === 0 ? 12 : hora % 12
  return `${en12}:00 ${sufijo}`
}

// getDay() de una fecha YYYY-MM-DD, sin pasar por la zona del dispositivo
function diaDeLaSemana(fecha: string): number {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  return new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay()
}

export interface HorarioDia {
  apertura: number
  cierre: number
}

/**
 * Unico punto que decide si el taller atiende un dia. Un festivo cierra el taller cuando cae en lunes (los
 * trasladados por la Ley Emiliani y cualquier otro que coincida con lunes); el resto se trabaja, salvo las fechas
 * de CIERRES_ADICIONALES.
 * @param fecha - `YYYY-MM-DD` en Colombia.
 * @returns Apertura y cierre en horas (0 a 24), o `null` si ese dia no hay servicio.
 */
export function horarioDelDia(fecha: string): HorarioDia | null {
  const dia = diaDeLaSemana(fecha)
  const horario = HORARIO_SEMANAL[dia]
  if (!horario) return null
  if (dia === 1 && esFestivo(fecha)) return null
  if (CIERRES_ADICIONALES.includes(fecha.slice(5))) return null
  return horario
}

export function esDiaConServicio(fecha: string): boolean {
  return horarioDelDia(fecha) !== null
}

/**
 * Primer dia con servicio estrictamente posterior al dia de `desde` (en hora de Bogota).
 * Colombia no tiene horario de verano: sumar 24 h siempre cae en el dia siguiente.
 * @returns `fecha` YYYY-MM-DD, `instante` a esa misma hora, y `dias` desde el dia de `desde`.
 */
export function siguienteDiaConServicio(desde: Date): { fecha: string; instante: Date; dias: number } {
  let dias = 1
  for (;;) {
    const instante = new Date(desde.getTime() + dias * DIA_MS)
    const { fecha } = relojBogota(instante)
    if (esDiaConServicio(fecha)) return { fecha, instante, dias }
    dias += 1
  }
}

/** Dia minimo que puede elegir el cliente para la fecha deseada: el siguiente con servicio, hoy no alcanza. */
export function primerDiaDisponible(ahora: Date): string {
  return siguienteDiaConServicio(ahora).fecha
}

function horasEntre(horario: HorarioDia): number[] {
  const ultima = horario.cierre - MARGEN_ULTIMA_ENTREGA_HORAS
  return Array.from({ length: ultima - horario.apertura + 1 }, (_, i) => horario.apertura + i)
}

/** Horas que puede elegir el cliente para recibir: de la apertura al cierre menos el margen. Vacia sin servicio. */
export function horasDeEntrega(fecha: string): number[] {
  const horario = horarioDelDia(fecha)
  return horario ? horasEntre(horario) : []
}

/**
 * Horas que ofrece el panel al acordar una entrega. Si el dia no tiene servicio (una excepcion que solo el taller
 * puede prometer) ofrece las de un dia ordinario para que el select nunca quede vacio.
 */
export function horasParaAcordar(fecha: string): number[] {
  const propias = horasDeEntrega(fecha)
  if (propias.length > 0) return propias
  return horasEntre(HORARIO_SEMANAL[1]!)
}

/** Los proximos `cantidad` dias con servicio a partir de `desde` (YYYY-MM-DD), `desde` incluido si atiende. */
export function diasConServicio(desde: string, cantidad: number): string[] {
  const [anio, mes, dia] = desde.split('-').map(Number)
  const dias: string[] = []
  for (let i = 0; dias.length < cantidad; i += 1) {
    const fecha = new Date(Date.UTC(anio, mes - 1, dia + i)).toISOString().slice(0, 10)
    if (esDiaConServicio(fecha)) dias.push(fecha)
  }
  return dias
}

/** Fecha en palabras, siempre en hora de Colombia. Ej. `lunes, 5 de octubre`. */
export function fechaEnPalabras(fecha: string): string {
  // mediodia de Bogota para que ningun corrimiento de zona cambie el dia que se muestra
  return new Date(`${fecha}T12:00:00-05:00`).toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: ZONA,
  })
}

/** Que pasa con un dia sin servicio, por que, y cual es el siguiente dia disponible. */
export function explicarDiaSinServicio(fecha: string): string {
  const siguiente = fechaEnPalabras(siguienteDiaConServicio(new Date(`${fecha}T12:00:00-05:00`)).fecha)
  const dia = diaDeLaSemana(fecha)
  if (!HORARIO_SEMANAL[dia]) {
    return `Los domingos no hay servicio, así que no podemos entregarte ese día. El siguiente día disponible es el ${siguiente}.`
  }
  if (dia === 1 && esFestivo(fecha)) {
    return `Ese lunes es festivo y el taller está cerrado. El siguiente día disponible es el ${siguiente}.`
  }
  return `Ese día el taller está cerrado. El siguiente día disponible es el ${siguiente}.`
}

// instante de la medianoche de Bogota del dia de `fecha`, redondeado al minuto
function inicioDelDia(fecha: Date): number {
  const aMinuto = Math.floor(fecha.getTime() / MINUTO_MS) * MINUTO_MS
  return aMinuto - relojBogota(fecha).minutos * MINUTO_MS
}

function enHoras(horas: number): string {
  return horas === 1 ? 'en la próxima hora' : `en las próximas ${horas} horas`
}

/**
 * Instante en que vence la promesa de contacto de una solicitud enviada en `desde`.
 * Dentro del horario del dia suma el plazo; antes de abrir cuenta desde la apertura de hoy; despues de cerrar o en
 * un dia sin servicio, desde la apertura del siguiente dia con servicio.
 */
export function limiteDeContacto(desde: Date): Date {
  const { fecha, minutos } = relojBogota(desde)
  const hoy = horarioDelDia(fecha)
  if (hoy && minutos >= hoy.apertura * 60 && minutos <= (hoy.cierre - PLAZO_CONTACTO_HORAS) * 60) {
    return new Date(desde.getTime() + PLAZO_CONTACTO_HORAS * HORA_MS)
  }
  if (hoy && minutos < hoy.apertura * 60) {
    return new Date(inicioDelDia(desde) + (hoy.apertura + PLAZO_CONTACTO_HORAS) * HORA_MS)
  }
  const siguiente = siguienteDiaConServicio(desde)
  const apertura = horarioDelDia(siguiente.fecha)!.apertura
  return new Date(inicioDelDia(siguiente.instante) + (apertura + PLAZO_CONTACTO_HORAS) * HORA_MS)
}

/**
 * Frase de la promesa de contacto, anclada al horario del taller en lugar de "X horas" corridas:
 * un taller artesanal no atiende de noche ni los domingos, y una promesa que se rompe por horario
 * erosiona justo la confianza que esta pantalla busca construir.
 * @param ahora - Momento en que el cliente envio la solicitud.
 */
export function promesaContacto(ahora: Date): string {
  const { fecha, minutos } = relojBogota(ahora)
  const hoy = horarioDelDia(fecha)

  if (hoy && minutos < hoy.apertura * 60) {
    // horaEnPalabras ya termina en punto ("a. m."): no se agrega otro al cerrar la frase
    return `Te escribimos por WhatsApp hoy, a partir de las ${horaEnPalabras(hoy.apertura)}`
  }
  if (hoy && minutos <= (hoy.cierre - PLAZO_CONTACTO_HORAS) * 60) {
    return `Te escribimos por WhatsApp ${enHoras(PLAZO_CONTACTO_HORAS)}.`
  }
  const siguiente = siguienteDiaConServicio(ahora)
  const apertura = horarioDelDia(siguiente.fecha)!.apertura
  const cuando =
    siguiente.dias === 1
      ? 'mañana'
      : `el ${siguiente.instante.toLocaleDateString('es-CO', { weekday: 'long', timeZone: ZONA })}`
  return `Te escribimos por WhatsApp ${cuando} a primera hora, a partir de las ${horaEnPalabras(apertura)}`
}
