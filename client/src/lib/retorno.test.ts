import { describe, it, expect } from 'vitest'
import { rutaDeRetorno, conRetorno, motivoDeRetorno } from './retorno'

describe('rutaDeRetorno', () => {
  it.each(['/pedido/abc', '/mis-pedidos', '/mis-pedidos/123', '/login-algo', '/registrar-no'])('acepta %s', (ruta) => {
    expect(rutaDeRetorno(ruta)).toBe(ruta)
  })

  it.each([[''], [null], [undefined], ['//otro.com'], ['https://otro.com'], ['pedido/abc'], ['/\\otro.com'], ['/ruta\nsalto'], ['/ruta\tcon-tab'],
    ['/login'], ['/registrar'], ['/datos'], ['/registrar?x=1'], ['/login#a'], ['/datos?x=1#y']])(
    'rechaza %j',
    (valor) => {
      expect(rutaDeRetorno(valor as string | null | undefined)).toBeNull()
    },
  )
})

describe('conRetorno', () => {
  it('agrega el destino sin codificar las barras', () => {
    expect(conRetorno('/login', '/pedido/abc')).toBe('/login?redirect=/pedido/abc')
  })
  it('codifica lo que rompería la URL', () => {
    expect(conRetorno('/registrar', '/x?y=1&z')).toBe('/registrar?redirect=/x%3Fy%3D1%26z')
  })
  it.each([[null], [undefined], ['//otro.com'], ['https://otro.com']])('sin destino válido (%j) deja la ruta sola', (d) => {
    expect(conRetorno('/login', d as string | null | undefined)).toBe('/login')
  })
})

describe('motivoDeRetorno', () => {
  it('clasifica pedido, mis pedidos y el resto', () => {
    expect(motivoDeRetorno('/pedido/abc')).toBe('pedido')
    expect(motivoDeRetorno('/mis-pedidos')).toBe('mis-pedidos')
    expect(motivoDeRetorno('/mis-pedidos/9')).toBe('mis-pedidos')
    expect(motivoDeRetorno('/catalogo')).toBeNull()
    expect(motivoDeRetorno('//otro.com')).toBeNull()
    expect(motivoDeRetorno(null)).toBeNull()
  })
})
