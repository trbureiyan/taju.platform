import { describe, it, expect } from 'vitest'
import {
  estaSinContactar,
  estaVencida,
  faltantesParaAvanzar,
  isoDesdePartes,
  partesBogota,
  promesaVencida,
  requiereConfirmacionDimension,
  sePuedeCancelar,
  textoEntrega,
} from './pedidoAdmin'
import { pedidoAdmin } from '../test/pedidos'

const en = (iso: string) => new Date(iso)

describe('faltantesParaAvanzar', () => {
  it('confirmar exige contacto, fecha acordada y, en un domicilio, la direccion', () => {
    const p = pedidoAdmin({ estado: 'en_revision', entrega: { metodo: 'domicilio', detalle: '' } })
    expect(faltantesParaAvanzar(p, 'confirmado')).toEqual([
      'marcar que ya hablaste con el cliente',
      'la fecha de entrega acordada',
      'la dirección de entrega',
    ])
  })

  it('con contacto, fecha y entrega registrados no falta nada', () => {
    const p = pedidoAdmin({
      estado: 'en_revision',
      contactadoEn: '2026-09-28T15:00:00.000Z',
      fechaEntrega: '2026-10-05T15:00:00.000Z',
    })
    expect(faltantesParaAvanzar(p, 'confirmado')).toEqual([])
  })

  it('producir exige el anticipo', () => {
    const sin = pedidoAdmin({ estado: 'confirmado' })
    const con = pedidoAdmin({
      estado: 'confirmado',
      pago: { monto: 50000, medio: 'nequi', registradoEn: '2026-09-29T15:00:00.000Z' },
    })
    expect(faltantesParaAvanzar(sin, 'en_produccion')).toEqual(['el anticipo'])
    expect(faltantesParaAvanzar(con, 'en_produccion')).toEqual([])
  })

  it('cancelar y los demas pasos no exigen nada', () => {
    const p = pedidoAdmin({ estado: 'en_produccion' })
    expect(faltantesParaAvanzar(p, 'cancelado')).toEqual([])
    expect(faltantesParaAvanzar(p, 'listo_para_entrega')).toEqual([])
  })
})

describe('sePuedeCancelar', () => {
  it('desde recibido, en_revision y confirmado; desde produccion ya no', () => {
    expect(sePuedeCancelar('recibido')).toBe(true)
    expect(sePuedeCancelar('confirmado')).toBe(true)
    expect(sePuedeCancelar('en_produccion')).toBe(false)
    expect(sePuedeCancelar('cancelado')).toBe(false)
  })
})

describe('requiereConfirmacionDimension', () => {
  it('solo al pasar a produccion con medida personalizada aun sin confirmar', () => {
    const p = pedidoAdmin({ estado: 'confirmado', esDimensionPersonalizada: true })
    expect(requiereConfirmacionDimension(p, 'en_produccion')).toBe(true)
    expect(requiereConfirmacionDimension(p, 'confirmado')).toBe(false)
    expect(requiereConfirmacionDimension(pedidoAdmin({ estado: 'confirmado' }), 'en_produccion')).toBe(false)
  })
})

describe('estaSinContactar', () => {
  it('es true en una solicitud abierta sin contacto y false una vez contactada o cerrada', () => {
    expect(estaSinContactar(pedidoAdmin({ estado: 'recibido' }))).toBe(true)
    expect(estaSinContactar(pedidoAdmin({ estado: 'recibido', contactadoEn: '2026-09-28T15:00:00.000Z' }))).toBe(false)
    expect(estaSinContactar(pedidoAdmin({ estado: 'confirmado' }))).toBe(false)
    expect(estaSinContactar(pedidoAdmin({ estado: 'cancelado' }))).toBe(false)
  })
})

describe('promesaVencida', () => {
  const solicitud = pedidoAdmin({ estado: 'recibido', fechaSolicitud: '2026-09-28T10:00:00-05:00' })

  it('vence justo despues del limite de contacto (12:00 para una solicitud de las 10:00)', () => {
    expect(promesaVencida(solicitud, en('2026-09-28T11:59:00-05:00'))).toBe(false)
    expect(promesaVencida(solicitud, en('2026-09-28T12:01:00-05:00'))).toBe(true)
  })

  it('una solicitud de noche no esta atrasada a la madrugada: cuenta desde que abre el taller', () => {
    const denoche = pedidoAdmin({ estado: 'recibido', fechaSolicitud: '2026-09-28T21:00:00-05:00' })
    expect(promesaVencida(denoche, en('2026-09-29T10:30:00-05:00'))).toBe(false)
    expect(promesaVencida(denoche, en('2026-09-29T11:30:00-05:00'))).toBe(true)
  })

  it('una solicitud ya contactada nunca tiene la promesa vencida', () => {
    const contactada = { ...solicitud, contactadoEn: '2026-09-28T10:30:00-05:00' }
    expect(promesaVencida(contactada, en('2026-10-30T12:00:00-05:00'))).toBe(false)
  })
})

describe('estaVencida', () => {
  it('cuenta 3 dias desde la solicitud si no hubo contacto', () => {
    const p = pedidoAdmin({ estado: 'recibido', fechaSolicitud: '2026-09-28T10:00:00-05:00' })
    expect(estaVencida(p, en('2026-10-01T09:59:00-05:00'))).toBe(false)
    expect(estaVencida(p, en('2026-10-01T10:00:00-05:00'))).toBe(true)
  })

  it('cuenta desde el contacto si ya hablaron', () => {
    const p = pedidoAdmin({
      estado: 'en_revision',
      fechaSolicitud: '2026-09-20T10:00:00-05:00',
      contactadoEn: '2026-09-28T10:00:00-05:00',
    })
    expect(estaVencida(p, en('2026-09-30T10:00:00-05:00'))).toBe(false)
    expect(estaVencida(p, en('2026-10-01T10:00:00-05:00'))).toBe(true)
  })

  it('solo aplica a solicitudes abiertas', () => {
    const p = pedidoAdmin({ estado: 'confirmado', fechaSolicitud: '2026-01-01T10:00:00-05:00' })
    expect(estaVencida(p, en('2026-10-01T10:00:00-05:00'))).toBe(false)
  })
})

describe('textoEntrega', () => {
  it('avisa cuando falta la direccion de un domicilio', () => {
    expect(textoEntrega(pedidoAdmin({}))).toBe('Recoge en el taller')
    expect(textoEntrega(pedidoAdmin({ entrega: { metodo: 'domicilio', detalle: '' } }))).toBe('Domicilio (falta dirección)')
    expect(textoEntrega(pedidoAdmin({ entrega: { metodo: 'domicilio', detalle: 'Cra 5' } }))).toBe('Domicilio: Cra 5')
  })
})

describe('partesBogota e isoDesdePartes', () => {
  it('son inversas en hora de Colombia', () => {
    expect(partesBogota('2026-12-12T22:00:00.000Z')).toEqual({ fecha: '2026-12-12', hora: '17:00' })
    expect(isoDesdePartes('2026-12-12', '17:00')).toBe('2026-12-12T22:00:00.000Z')
  })
})
