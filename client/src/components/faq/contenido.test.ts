import { describe, it, expect } from 'vitest'
import { GRUPOS_FAQ } from './contenido'
import { formatearPesos } from '../../lib/precio'
import { ANTICIPO_PORCENTAJE, DOMICILIO_BOGOTA_USUAL, TARIFAS_DOMICILIO } from '../../lib/politicas'

const todas = GRUPOS_FAQ.flatMap((g) => g.preguntas)
const texto = (id: string) => {
  const p = todas.find((x) => x.id === id)
  if (!p) throw new Error(`falta la pregunta ${id}`)
  return p.respuesta.join(' ')
}
const VOSEO = /[!¡]|(Creá|Ingresá|Esperá|Registrate|tenés|querés|podés|escribinos)(?![\p{L}])/u

describe('contenido de las preguntas frecuentes', () => {
  it('tiene grupos con preguntas, ids únicos y preguntas bien escritas', () => {
    expect(GRUPOS_FAQ.length).toBeGreaterThanOrEqual(4)
    const ids = todas.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const p of todas) {
      expect(p.pregunta.startsWith('¿')).toBe(true)
      expect(p.pregunta.endsWith('?')).toBe(true)
      expect(p.respuesta.length).toBeGreaterThan(0)
    }
  })

  it('sigue la voz de marca: tuteo, sin voseo ni exclamaciones', () => {
    for (const p of todas) expect(`${p.pregunta} ${p.respuesta.join(' ')}`).not.toMatch(VOSEO)
  })

  it('el tiempo de respuesta es de 30 minutos a 2 horas de atención', () => {
    expect(texto('tiempo-respuesta')).toMatch(/30 minutos/)
    expect(texto('tiempo-respuesta')).toMatch(/2 horas/)
  })

  it('el horario sale de la tabla del taller e incluye que los domingos no hay servicio', () => {
    const t = texto('horario')
    expect(t).toMatch(/lunes a viernes/i)
    expect(t).toMatch(/sábados/i)
    expect(t).toMatch(/domingos/i)
  })

  it('el pago lista los medios confirmados y el anticipo sale de la política', () => {
    const t = texto('pago')
    for (const medio of ['Efectivo', 'Nequi', 'Bancolombia', 'Bre-B']) expect(t).toContain(medio)
    expect(t).toContain(`${ANTICIPO_PORCENTAJE} %`)
    expect(t).toMatch(/no cobra/i)
  })

  it('dice sin rodeos que no hay reembolsos ni devoluciones, y qué hacer si algo llega distinto', () => {
    const t = texto('reembolsos')
    expect(t).toContain('No hacemos reembolsos ni devoluciones')
    expect(t).toMatch(/WhatsApp/)
  })

  it('el domicilio muestra todas las tarifas con el formato de pesos del sitio', () => {
    const t = texto('domicilio')
    for (const tarifa of TARIFAS_DOMICILIO) {
      expect(t).toContain(tarifa.zona)
      expect(t).toContain(formatearPesos(tarifa.desde))
      if (tarifa.hasta) expect(t).toContain(formatearPesos(tarifa.hasta))
    }
    expect(t).toContain(formatearPesos(DOMICILIO_BOGOTA_USUAL))
    expect(t).toMatch(/suele/)
  })

  it('no promete un tiempo de producción que el taller no confirmó', () => {
    for (const p of todas) {
      expect(`${p.pregunta} ${p.respuesta.join(' ')}`).not.toMatch(/(producci[oó]n|elaboraci[oó]n)[^.]*\d+\s*(horas|d[ií]as)/i)
    }
  })

  it('los enlaces son internos o https', () => {
    for (const p of todas) {
      if (p.enlace) expect(p.enlace.a).toMatch(/^(\/|https:\/\/)/)
    }
  })
})
