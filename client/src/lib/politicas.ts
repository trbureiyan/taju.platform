// los numeros del taller en un solo lugar: los textos, los limites y el panel los leen de aqui.
// Cambiar una politica es tocar una linea; ninguna otra parte del cliente repite estos valores.

// getDay() de Colombia: 0 domingo a 6 sabado. null = sin servicio. Es la unica fuente de dias y horas del taller:
// el horario de atencion, la promesa de contacto, el "vencida" del panel y las horas de entrega salen de aqui.
export const HORARIO_SEMANAL: Record<number, { apertura: number; cierre: number } | null> = {
  0: null,
  1: { apertura: 8, cierre: 18 },
  2: { apertura: 8, cierre: 18 },
  3: { apertura: 8, cierre: 18 },
  4: { apertura: 8, cierre: 18 },
  5: { apertura: 8, cierre: 18 },
  6: { apertura: 8, cierre: 16 },
}

// horas antes del cierre en que sigue siendo valida la ultima hora de entrega (provisional, por confirmar con el taller)
export const MARGEN_ULTIMA_ENTREGA_HORAS = 1

// fechas MM-DD en que el taller cierra aunque no caigan en lunes; vacia hasta que el taller confirme cuales
// (Navidad, Año Nuevo, Semana Santa...). Un festivo que cae en lunes ya cierra por regla, no hace falta listarlo
export const CIERRES_ADICIONALES: readonly string[] = []

// [DECISION] festivos calculados (Pascua + Ley Emiliani) y no una lista escrita a mano - la lista obligaba a
// extenderla cada diciembre. Tradeoff: una reforma legal no se refleja sola; se corrige aqui, y con la regla de
// cierre (solo los festivos en lunes cierran el taller) solo importa un lunes nuevo. Los tests fijan 2025 a 2028.

const DIA_MS = 86_400_000

// mediodia UTC: sumar dias y leer la fecha ISO no depende de ninguna zona horaria
function utc(anio: number, mes: number, dia: number): Date {
  return new Date(Date.UTC(anio, mes - 1, dia, 12))
}

function sumarDias(fecha: Date, dias: number): Date {
  return new Date(fecha.getTime() + dias * DIA_MS)
}

// el lunes igual o posterior: un lunes se queda, un domingo avanza 1, un martes avanza 6...
function alLunes(fecha: Date): Date {
  return sumarDias(fecha, (8 - fecha.getUTCDay()) % 7)
}

function aIso(fecha: Date): string {
  return fecha.toISOString().slice(0, 10)
}

// domingo de Pascua, algoritmo gregoriano anonimo (Meeus/Jones/Butcher)
function pascua(anio: number): Date {
  const a = anio % 19
  const b = Math.floor(anio / 100)
  const c = anio % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const mes = Math.floor((h + l - 7 * m + 114) / 31)
  const dia = ((h + l - 7 * m + 114) % 31) + 1
  return utc(anio, mes, dia)
}

const FESTIVOS_FIJOS: ReadonlyArray<readonly [number, number]> = [
  [1, 1], [5, 1], [7, 20], [8, 7], [12, 8], [12, 25],
]

// Ley Emiliani: se trasladan al lunes siguiente (si ya es lunes, se quedan)
const FESTIVOS_AL_LUNES: ReadonlyArray<readonly [number, number]> = [
  [1, 6], [3, 19], [6, 29], [8, 15], [10, 12], [11, 1], [11, 11],
]

/** @returns Las fechas `YYYY-MM-DD` de los festivos de Colombia del año (18, o 17 si dos coinciden). */
export function festivosDelAnio(anio: number): ReadonlySet<string> {
  const domingoDePascua = pascua(anio)
  const fechas = [
    ...FESTIVOS_FIJOS.map(([mes, dia]) => utc(anio, mes, dia)),
    ...FESTIVOS_AL_LUNES.map(([mes, dia]) => alLunes(utc(anio, mes, dia))),
    sumarDias(domingoDePascua, -3), // Jueves Santo
    sumarDias(domingoDePascua, -2), // Viernes Santo
    alLunes(sumarDias(domingoDePascua, 39)), // Ascension
    alLunes(sumarDias(domingoDePascua, 60)), // Corpus Christi
    alLunes(sumarDias(domingoDePascua, 68)), // Sagrado Corazon
  ]
  return new Set(fechas.map(aIso))
}

const festivosPorAnio = new Map<number, ReadonlySet<string>>()

/** @param fecha - Fecha `YYYY-MM-DD` en Colombia. */
export function esFestivo(fecha: string): boolean {
  const anio = Number(fecha.slice(0, 4))
  let festivos = festivosPorAnio.get(anio)
  if (!festivos) {
    festivos = festivosDelAnio(anio)
    festivosPorAnio.set(anio, festivos)
  }
  return festivos.has(fecha)
}

// plazo en horas de atencion para escribirle al cliente despues de una solicitud
export const PLAZO_CONTACTO_HORAS = 2

// domicilio: valor en pesos que paga quien pide. `hasta` cuando depende del lugar. Fuera de esas zonas el valor se
// confirma por WhatsApp; a Bogota suele ser DOMICILIO_BOGOTA_USUAL (orientativo, no una tarifa fija)
export const TARIFAS_DOMICILIO: readonly { zona: string; desde: number; hasta?: number }[] = [
  { zona: 'Centro de Neiva', desde: 6000 },
  { zona: 'Norte de Neiva', desde: 7000 },
  { zona: 'Sur de Neiva y norte lejano', desde: 8000 },
  { zona: 'Fuera de Neiva', desde: 9000, hasta: 10000 },
]
export const DOMICILIO_BOGOTA_USUAL = 12000

// anticipo habitual sobre el valor acordado; solo orienta al taller, la plataforma no cobra
export const ANTICIPO_PORCENTAJE = 50

// dias sin respuesta para marcar una solicitud como vencida en el panel (la cancelacion la decide una persona)
export const DIAS_SIN_RESPUESTA = 3
