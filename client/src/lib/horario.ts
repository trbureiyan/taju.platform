import { HORARIO_ATENCION, PLAZO_CONTACTO_HORAS, esFestivo } from './politicas'

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

// dia de atencion: dentro de los dias habiles del horario y no festivo
function esHabil(fecha: Date): boolean {
  const { dia, fecha: dia8 } = relojBogota(fecha)
  return HORARIO_ATENCION.diasHabiles.includes(dia) && !esFestivo(dia8)
}

// Colombia no tiene horario de verano: sumar 24 h siempre cae en el dia siguiente
function proximoDiaHabil(desde: Date): { fecha: Date; dias: number } {
  let dias = 1
  while (!esHabil(new Date(desde.getTime() + dias * DIA_MS))) dias += 1
  return { fecha: new Date(desde.getTime() + dias * DIA_MS), dias }
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
 * Dentro del horario suma el plazo; antes de abrir o despues de cerrar, cuenta desde la apertura del dia habil.
 */
export function limiteDeContacto(desde: Date): Date {
  const { apertura, cierre } = HORARIO_ATENCION
  const { minutos } = relojBogota(desde)
  const habil = esHabil(desde)
  if (habil && minutos >= apertura * 60 && minutos <= (cierre - PLAZO_CONTACTO_HORAS) * 60) {
    return new Date(desde.getTime() + PLAZO_CONTACTO_HORAS * HORA_MS)
  }
  const base = habil && minutos < apertura * 60 ? desde : proximoDiaHabil(desde).fecha
  return new Date(inicioDelDia(base) + (apertura + PLAZO_CONTACTO_HORAS) * HORA_MS)
}

/**
 * Frase de la promesa de contacto, anclada al horario del taller en lugar de "X horas" corridas:
 * un taller artesanal no atiende de noche ni en fin de semana, y una promesa que se rompe por horario
 * erosiona justo la confianza que esta pantalla busca construir.
 * @param ahora - Momento en que el cliente envio la solicitud.
 */
export function promesaContacto(ahora: Date): string {
  const { apertura, cierre } = HORARIO_ATENCION
  const { minutos } = relojBogota(ahora)
  const habil = esHabil(ahora)

  if (habil && minutos < apertura * 60) {
    // horaEnPalabras ya termina en punto ("a. m."): no se agrega otro al cerrar la frase
    return `Te escribimos por WhatsApp hoy, a partir de las ${horaEnPalabras(apertura)}`
  }
  if (habil && minutos <= (cierre - PLAZO_CONTACTO_HORAS) * 60) {
    return `Te escribimos por WhatsApp ${enHoras(PLAZO_CONTACTO_HORAS)}.`
  }
  const { fecha, dias } = proximoDiaHabil(ahora)
  const cuando = dias === 1 ? 'mañana' : `el ${fecha.toLocaleDateString('es-CO', { weekday: 'long', timeZone: ZONA })}`
  return `Te escribimos por WhatsApp ${cuando} a primera hora, a partir de las ${horaEnPalabras(apertura)}`
}
