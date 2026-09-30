import { describe, it, expect } from 'vitest'
import {
  diasConServicio,
  esDiaConServicio,
  explicarDiaSinServicio,
  fechaEnPalabras,
  horaEnPalabras,
  horarioDelDia,
  horasDeEntrega,
  horasParaAcordar,
  limiteDeContacto,
  primerDiaDisponible,
  promesaContacto,
  relojBogota,
  siguienteDiaConServicio,
} from './horario'

const en = (iso: string) => new Date(iso)

describe('relojBogota', () => {
  it('lee dia de la semana, minutos y fecha en la hora de Colombia', () => {
    expect(relojBogota(en('2026-09-28T10:30:00-05:00'))).toEqual({ dia: 1, minutos: 630, fecha: '2026-09-28' })
  })

  it('la medianoche cuenta como minuto 0 y no como 24:00', () => {
    expect(relojBogota(en('2026-09-29T00:00:00-05:00'))).toEqual({ dia: 2, minutos: 0, fecha: '2026-09-29' })
  })

  it('una noche que en UTC ya es el dia siguiente sigue siendo el mismo dia en Colombia', () => {
    expect(relojBogota(en('2026-09-29T03:00:00Z'))).toEqual({ dia: 1, minutos: 1320, fecha: '2026-09-28' })
  })
})

describe('horaEnPalabras', () => {
  it.each([
    [8, '8:00 a. m.'],
    [12, '12:00 p. m.'],
    [18, '6:00 p. m.'],
  ])('%i -> %s', (hora, esperado) => {
    expect(horaEnPalabras(hora)).toBe(esperado)
  })
})

// Semana de referencia: lunes 28 de septiembre de 2026. Lunes a viernes 8 a 18, sabados 8 a 16, domingos sin
// servicio. Un festivo cierra el taller solo si cae en lunes (12 de octubre de 2026 es lunes festivo).
describe('horarioDelDia', () => {
  it.each([
    ['lunes', '2026-09-28', { apertura: 8, cierre: 18 }],
    ['viernes', '2026-10-02', { apertura: 8, cierre: 18 }],
    ['sabado', '2026-10-03', { apertura: 8, cierre: 16 }],
    ['domingo', '2026-10-04', null],
    ['lunes festivo', '2026-10-12', null],
    ['viernes festivo (1 de mayo de 2026) se trabaja', '2026-05-01', { apertura: 8, cierre: 18 }],
    ['jueves santo se trabaja hasta que Juan Camilo diga otra cosa', '2026-04-02', { apertura: 8, cierre: 18 }],
    ['navidad en viernes se trabaja hasta que Juan Camilo diga otra cosa', '2026-12-25', { apertura: 8, cierre: 18 }],
  ])('%s', (_caso, fecha, esperado) => {
    expect(horarioDelDia(fecha)).toEqual(esperado)
  })

  it('esDiaConServicio sigue a horarioDelDia', () => {
    expect(esDiaConServicio('2026-10-03')).toBe(true)
    expect(esDiaConServicio('2026-10-04')).toBe(false)
  })
})

describe('siguienteDiaConServicio y primerDiaDisponible', () => {
  it.each([
    ['viernes -> sabado', '2026-09-25T10:00:00-05:00', '2026-09-26'],
    ['sabado en la tarde -> lunes (el domingo no hay servicio)', '2026-10-03T15:00:00-05:00', '2026-10-05'],
    ['domingo -> lunes', '2026-10-04T10:00:00-05:00', '2026-10-05'],
    ['sabado con lunes festivo -> martes', '2026-10-10T10:00:00-05:00', '2026-10-13'],
    ['lunes -> martes', '2026-09-28T10:00:00-05:00', '2026-09-29'],
    ['noche que en UTC ya es otro dia se cuenta en Bogota', '2026-09-29T02:00:00Z', '2026-09-29'],
  ])('%s', (_caso, ahora, esperado) => {
    expect(primerDiaDisponible(en(ahora))).toBe(esperado)
    expect(siguienteDiaConServicio(en(ahora)).fecha).toBe(esperado)
  })

  it('cuenta los dias que hay hasta el siguiente con servicio', () => {
    expect(siguienteDiaConServicio(en('2026-09-28T10:00:00-05:00')).dias).toBe(1)
    expect(siguienteDiaConServicio(en('2026-10-03T15:00:00-05:00')).dias).toBe(2)
    expect(siguienteDiaConServicio(en('2026-10-10T10:00:00-05:00')).dias).toBe(3)
  })
})

describe('horasDeEntrega y horasParaAcordar', () => {
  it('lunes a viernes ofrece de 8 a 17 (una hora antes del cierre)', () => {
    expect(horasDeEntrega('2026-09-28')).toEqual([8, 9, 10, 11, 12, 13, 14, 15, 16, 17])
  })

  it('el sabado termina a las 3 p. m.', () => {
    expect(horasDeEntrega('2026-10-03')).toEqual([8, 9, 10, 11, 12, 13, 14, 15])
  })

  it('un dia sin servicio no ofrece horas de entrega', () => {
    expect(horasDeEntrega('2026-10-04')).toEqual([])
  })

  it('para acordar, un dia con servicio ofrece las suyas', () => {
    expect(horasParaAcordar('2026-10-03')).toEqual(horasDeEntrega('2026-10-03'))
  })

  it.each([
    ['domingo', '2026-10-04'],
    ['lunes festivo', '2026-10-12'],
  ])('para acordar, un %s ofrece las de un dia ordinario y nunca queda vacio', (_caso, fecha) => {
    expect(horasParaAcordar(fecha)).toEqual([8, 9, 10, 11, 12, 13, 14, 15, 16, 17])
  })
})

describe('diasConServicio', () => {
  it('lista solo dias con servicio, empieza en el primero y salta domingos y lunes festivos', () => {
    // sabado 10 de octubre, luego (domingo y lunes festivo fuera) martes 13, miercoles 14...
    expect(diasConServicio('2026-10-10', 4)).toEqual(['2026-10-10', '2026-10-13', '2026-10-14', '2026-10-15'])
  })

  it('si el dia de partida no tiene servicio, no se incluye', () => {
    expect(diasConServicio('2026-10-04', 2)).toEqual(['2026-10-05', '2026-10-06'])
  })
})

describe('fechaEnPalabras y explicarDiaSinServicio', () => {
  it('escribe el dia de la semana en hora de Colombia', () => {
    expect(fechaEnPalabras('2026-10-05')).toBe('lunes, 5 de octubre')
  })

  it('domingo: dice que no hay servicio y cual es el siguiente dia disponible', () => {
    expect(explicarDiaSinServicio('2026-10-04')).toBe(
      'Los domingos no hay servicio, así que no podemos entregarte ese día. El siguiente día disponible es el lunes, 5 de octubre.',
    )
  })

  it('lunes festivo: dice que el taller esta cerrado y cual es el siguiente dia disponible', () => {
    expect(explicarDiaSinServicio('2026-10-12')).toBe(
      'Ese lunes es festivo y el taller está cerrado. El siguiente día disponible es el martes, 13 de octubre.',
    )
  })
})

// [Review Focus] nunca prometer "en 2 horas" fuera de horario: la promesa dice cuando abre el taller.
describe('promesaContacto', () => {
  it.each([
    ['lunes antes de abrir', '2026-09-28T06:00:00-05:00', 'Te escribimos por WhatsApp hoy, a partir de las 8:00 a. m.'],
    ['lunes dentro del horario', '2026-09-28T10:00:00-05:00', 'Te escribimos por WhatsApp en las próximas 2 horas.'],
    ['lunes justo en el limite del plazo', '2026-09-28T16:00:00-05:00', 'Te escribimos por WhatsApp en las próximas 2 horas.'],
    [
      'lunes cuando el plazo ya no cabe antes de cerrar',
      '2026-09-28T16:30:00-05:00',
      'Te escribimos por WhatsApp mañana a primera hora, a partir de las 8:00 a. m.',
    ],
    ['sabado dentro del horario', '2026-10-03T10:00:00-05:00', 'Te escribimos por WhatsApp en las próximas 2 horas.'],
    ['sabado en el limite (cierra a las 4 p. m.)', '2026-10-03T14:00:00-05:00', 'Te escribimos por WhatsApp en las próximas 2 horas.'],
    [
      'sabado en la tarde pasa al lunes porque el domingo no hay servicio',
      '2026-10-03T14:30:00-05:00',
      'Te escribimos por WhatsApp el lunes a primera hora, a partir de las 8:00 a. m.',
    ],
    [
      'domingo pasa al lunes',
      '2026-10-04T10:00:00-05:00',
      'Te escribimos por WhatsApp mañana a primera hora, a partir de las 8:00 a. m.',
    ],
    [
      'un lunes festivo (12 de octubre) pasa al martes',
      '2026-10-12T10:00:00-05:00',
      'Te escribimos por WhatsApp mañana a primera hora, a partir de las 8:00 a. m.',
    ],
    [
      'la vispera de un lunes festivo salta domingo y lunes',
      '2026-10-10T15:00:00-05:00',
      'Te escribimos por WhatsApp el martes a primera hora, a partir de las 8:00 a. m.',
    ],
    ['un viernes festivo se trabaja', '2026-05-01T10:00:00-05:00', 'Te escribimos por WhatsApp en las próximas 2 horas.'],
    [
      'jueves santo se trabaja: la vispera en la tarde pasa al jueves',
      '2026-04-01T17:00:00-05:00',
      'Te escribimos por WhatsApp mañana a primera hora, a partir de las 8:00 a. m.',
    ],
  ])('%s', (_caso, iso, esperado) => {
    expect(promesaContacto(en(iso))).toBe(esperado)
  })
})

describe('limiteDeContacto', () => {
  it.each([
    ['dentro del horario suma el plazo', '2026-09-28T10:00:00-05:00', '2026-09-28T12:00:00-05:00'],
    ['antes de abrir cuenta desde la apertura', '2026-09-28T06:00:00-05:00', '2026-09-28T10:00:00-05:00'],
    [
      'despues de cerrar cuenta desde la apertura del dia siguiente',
      '2026-09-28T17:00:00-05:00',
      '2026-09-29T10:00:00-05:00',
    ],
    ['un sabado dentro del horario suma el plazo', '2026-10-03T10:00:00-05:00', '2026-10-03T12:00:00-05:00'],
    [
      'un sabado a las 3 p. m. cuenta desde la apertura del lunes',
      '2026-10-03T15:00:00-05:00',
      '2026-10-05T10:00:00-05:00',
    ],
    ['un domingo cuenta desde la apertura del lunes', '2026-10-04T10:00:00-05:00', '2026-10-05T10:00:00-05:00'],
    [
      'un lunes festivo cuenta desde la apertura del martes',
      '2026-10-12T10:00:00-05:00',
      '2026-10-13T10:00:00-05:00',
    ],
    [
      'la vispera de un lunes festivo salta domingo y lunes',
      '2026-10-10T15:00:00-05:00',
      '2026-10-13T10:00:00-05:00',
    ],
  ])('%s', (_caso, desde, esperado) => {
    expect(limiteDeContacto(en(desde)).toISOString()).toBe(en(esperado).toISOString())
  })
})
