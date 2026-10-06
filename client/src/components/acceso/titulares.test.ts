import { describe, it, expect } from 'vitest'
import { titularDeAcceso } from './titulares'

// \b de JS no trata á/é como letra: se usa un lookahead Unicode
const VOSEO = /[!¡]|(Creá|Ingresá|Esperá|Registrate|tenés|querés|podés)(?![\p{L}])/u

describe('filtro de voseo', () => {
  it.each(['Creá tu cuenta', 'Ingresá a tu cuenta', 'Registrate'])('marca %j', (t) => expect(t).toMatch(VOSEO))
  it('no marca español con tuteo', () => expect('Crea tu cuenta').not.toMatch(VOSEO))
  it('el regex anterior no marcaba tildes', () => expect('Creá tu cuenta').not.toMatch(/\b(Creá)\b/))
})

describe('titularDeAcceso', () => {
  it('registro desde un pedido explica el motivo', () => {
    const t = titularDeAcceso('registro', 'pedido')
    expect(t.titulo).toBe('Antes de enviar tu solicitud, crea tu cuenta')
    expect(t.apoyo).toMatch(/saber quién eres/)
  })
  it('ingreso desde un pedido', () => {
    expect(titularDeAcceso('ingreso', 'pedido').titulo).toBe('Ingresa para enviar tu solicitud')
  })
  it('mis pedidos', () => {
    expect(titularDeAcceso('registro', 'mis-pedidos').titulo).toBe('Crea tu cuenta para ver tus pedidos')
    expect(titularDeAcceso('ingreso', 'mis-pedidos').titulo).toBe('Ingresa para ver tus pedidos')
  })
  it('sin motivo usa la versión general', () => {
    expect(titularDeAcceso('registro', null).titulo).toBe('Crea tu cuenta de TaJú')
    expect(titularDeAcceso('ingreso', null).titulo).toBe('Ingresa a tu cuenta')
  })
  it.each(['registro', 'ingreso'] as const)('ningún texto de %s usa voseo ni exclamaciones', (modo) => {
    for (const motivo of ['pedido', 'mis-pedidos', null] as const) {
      const { titulo, apoyo } = titularDeAcceso(modo, motivo)
      expect(`${titulo} ${apoyo}`).not.toMatch(VOSEO)
    }
  })
})
