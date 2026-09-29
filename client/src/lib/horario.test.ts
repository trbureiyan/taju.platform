import { describe, it, expect } from 'vitest'
import { horaEnPalabras, limiteDeContacto, promesaContacto, relojBogota } from './horario'

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
    [9, '9:00 a. m.'],
    [12, '12:00 p. m.'],
    [18, '6:00 p. m.'],
  ])('%i -> %s', (hora, esperado) => {
    expect(horaEnPalabras(hora)).toBe(esperado)
  })
})

// [Review Focus] nunca prometer "en 2 horas" fuera de horario: la promesa dice cuando abre el taller.
// Semana de referencia: lunes 28 de septiembre de 2026. El taller atiende todos los dias salvo festivos.
describe('promesaContacto', () => {
  it.each([
    ['lunes antes de abrir', '2026-09-28T06:00:00-05:00', 'Te escribimos por WhatsApp hoy, a partir de las 9:00 a. m.'],
    ['lunes dentro del horario', '2026-09-28T10:00:00-05:00', 'Te escribimos por WhatsApp en las próximas 2 horas.'],
    ['lunes justo en el limite del plazo', '2026-09-28T16:00:00-05:00', 'Te escribimos por WhatsApp en las próximas 2 horas.'],
    [
      'lunes cuando el plazo ya no cabe antes de cerrar',
      '2026-09-28T16:30:00-05:00',
      'Te escribimos por WhatsApp mañana a primera hora, a partir de las 9:00 a. m.',
    ],
    ['sabado dentro del horario', '2026-10-03T10:00:00-05:00', 'Te escribimos por WhatsApp en las próximas 2 horas.'],
    ['domingo dentro del horario', '2026-10-04T10:00:00-05:00', 'Te escribimos por WhatsApp en las próximas 2 horas.'],
    [
      'sabado en la tarde pasa al domingo',
      '2026-10-03T17:00:00-05:00',
      'Te escribimos por WhatsApp mañana a primera hora, a partir de las 9:00 a. m.',
    ],
    [
      'un festivo (lunes 12 de octubre) pasa al martes',
      '2026-10-12T10:00:00-05:00',
      'Te escribimos por WhatsApp mañana a primera hora, a partir de las 9:00 a. m.',
    ],
    [
      'jueves santo: el viernes santo tambien es festivo, se retoma el sabado',
      '2026-04-02T10:00:00-05:00',
      'Te escribimos por WhatsApp el sábado a primera hora, a partir de las 9:00 a. m.',
    ],
    [
      'miercoles en la tarde antes de semana santa salta los dos festivos',
      '2026-04-01T17:00:00-05:00',
      'Te escribimos por WhatsApp el sábado a primera hora, a partir de las 9:00 a. m.',
    ],
  ])('%s', (_caso, iso, esperado) => {
    expect(promesaContacto(en(iso))).toBe(esperado)
  })
})

describe('limiteDeContacto', () => {
  it.each([
    ['dentro del horario suma el plazo', '2026-09-28T10:00:00-05:00', '2026-09-28T12:00:00-05:00'],
    ['antes de abrir cuenta desde la apertura', '2026-09-28T06:00:00-05:00', '2026-09-28T11:00:00-05:00'],
    [
      'despues de cerrar cuenta desde la apertura del dia siguiente',
      '2026-09-28T17:00:00-05:00',
      '2026-09-29T11:00:00-05:00',
    ],
    ['un domingo dentro del horario tambien suma el plazo', '2026-10-04T10:00:00-05:00', '2026-10-04T12:00:00-05:00'],
    [
      'un festivo cuenta desde la apertura del siguiente dia de atencion',
      '2026-10-12T10:00:00-05:00',
      '2026-10-13T11:00:00-05:00',
    ],
    [
      'la vispera de semana santa salta los festivos',
      '2026-04-01T17:00:00-05:00',
      '2026-04-04T11:00:00-05:00',
    ],
  ])('%s', (_caso, desde, esperado) => {
    expect(limiteDeContacto(en(desde)).toISOString()).toBe(en(esperado).toISOString())
  })
})
