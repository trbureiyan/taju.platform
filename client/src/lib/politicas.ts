// los numeros del taller en un solo lugar: los textos, los limites y el panel los leen de aqui.
// Cambiar una politica es tocar una linea; ninguna otra parte del cliente repite estos valores.

export const HORARIO_ATENCION: { diasHabiles: readonly number[]; apertura: number; cierre: number } = {
  // getDay() de Colombia: todos los dias, domingo incluido; los festivos se excluyen en FESTIVOS
  diasHabiles: [0, 1, 2, 3, 4, 5, 6],
  apertura: 9,
  cierre: 18,
}

// [DECISION] festivos de Colombia como lista fija y no calculados (Pascua + Ley Emiliani): son datos que
// cambian una vez al ano y el calculo pesaria mas que mantener la lista. Tradeoff: hay que extenderla cada
// diciembre; sin ella un festivo se trata como dia de atencion y la promesa de contacto se adelanta un dia.
export const FESTIVOS: ReadonlySet<string> = new Set([
  // 2026
  '2026-01-01', '2026-01-12', '2026-03-23', '2026-04-02', '2026-04-03', '2026-05-01',
  '2026-05-18', '2026-06-08', '2026-06-15', '2026-06-29', '2026-07-20', '2026-08-07',
  '2026-08-17', '2026-10-12', '2026-11-02', '2026-11-16', '2026-12-08', '2026-12-25',
  // 2027
  '2027-01-01', '2027-01-11', '2027-03-22', '2027-03-25', '2027-03-26', '2027-05-01',
  '2027-05-10', '2027-05-31', '2027-06-07', '2027-07-05', '2027-07-20', '2027-08-07',
  '2027-08-16', '2027-10-18', '2027-11-01', '2027-11-15', '2027-12-08', '2027-12-25',
  // 2028
  '2028-01-01', '2028-01-10', '2028-03-20', '2028-04-13', '2028-04-14', '2028-05-01',
  '2028-05-29', '2028-06-19', '2028-06-26', '2028-07-03', '2028-07-20', '2028-08-07',
  '2028-08-21', '2028-10-16', '2028-11-06', '2028-11-13', '2028-12-08', '2028-12-25',
])

/** @param fecha - Fecha `YYYY-MM-DD` en Colombia. */
export function esFestivo(fecha: string): boolean {
  return FESTIVOS.has(fecha)
}

// plazo en horas habiles para escribirle al cliente despues de una solicitud
export const PLAZO_CONTACTO_HORAS = 2

// anticipo habitual sobre el valor acordado; solo orienta al taller, la plataforma no cobra
export const ANTICIPO_PORCENTAJE = 50

// dias sin respuesta para marcar una solicitud como vencida en el panel (la cancelacion la decide una persona)
export const DIAS_SIN_RESPUESTA = 3

// horas ofrecidas al pedir o acordar una entrega: de la apertura al cierre, una por hora
export const HORAS_DE_ENTREGA: readonly number[] = Array.from(
  { length: HORARIO_ATENCION.cierre - HORARIO_ATENCION.apertura + 1 },
  (_, i) => HORARIO_ATENCION.apertura + i,
)
