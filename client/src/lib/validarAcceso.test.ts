import { describe, it, expect } from 'vitest'
import { ErrorApi } from './api'
import {
  validarNombre,
  validarCorreo,
  validarContrasena,
  validarContrasenaIngreso,
  errorDeAcceso,
} from './validarAcceso'

describe('validarNombre', () => {
  it.each([[''], ['   '], ['A'], [' A ']])('rechaza %j', (v) => expect(validarNombre(v)).not.toBeNull())
  it.each([['Al'], ['  Ana  '], ['A'.repeat(120)]])('acepta %j', (v) => expect(validarNombre(v)).toBeNull())
  it('rechaza más de 120 caracteres', () => expect(validarNombre('A'.repeat(121))).toMatch(/120/))
})

describe('validarCorreo', () => {
  it.each([[''], ['ana'], ['ana@'], ['ana@taju'], ['ana @taju.co'], ['@taju.co'],
    ['ana..x@taju.co'], ['ana.@taju.co'], ['.ana@taju.co'], ['ana@taju.c'], ['ana@taju.co.'], ['ana@-taju.co'],
    ['ana@taju.123'], ['ana@taju_x.co'], ['año@taju.co']])('rechaza %j', (v) =>
    expect(validarCorreo(v)).not.toBeNull(),
  )
  it.each([['ana@taju.co'], ['  ana@taju.co  '], ['ana.perez+pedidos@taju.com.co'], ['a@b.co']])('acepta %j', (v) =>
    expect(validarCorreo(v)).toBeNull(),
  )
})

describe('validarContrasena', () => {
  it('pide una contraseña si está vacía', () => expect(validarContrasena('')).not.toBeNull())
  it('con 7 caracteres dice cuántos lleva', () => expect(validarContrasena('1234567')).toMatch(/Ahora tiene 7/))
  it('con 8 es válida', () => expect(validarContrasena('12345678')).toBeNull())
  it('en el ingreso solo exige que haya algo', () => {
    expect(validarContrasenaIngreso('')).not.toBeNull()
    expect(validarContrasenaIngreso('x')).toBeNull()
  })
})

describe('errorDeAcceso', () => {
  it('409 en registro va al campo del correo', () => {
    const e = errorDeAcceso(new ErrorApi('El correo ya está registrado', 409), 'registro')
    expect(e.destino).toBe('correo')
    expect(e.mensaje).toMatch(/ya tiene una cuenta/)
  })
  it('401 en ingreso es un aviso con el siguiente paso', () => {
    const e = errorDeAcceso(new ErrorApi('Credenciales incorrectas', 401), 'ingreso')
    expect(e.destino).toBe('aviso')
    expect(e.mensaje).toMatch(/Revisa tu correo y tu contraseña/)
  })
  it('429 va al snackbar y no repite el texto del servidor', () => {
    const e = errorDeAcceso(new ErrorApi('Demasiados intentos. Esperá unos minutos', 429), 'ingreso')
    expect(e.destino).toBe('snackbar')
    expect(e.mensaje).not.toMatch(/Esperá/)
    expect(e.mensaje).toMatch(/Espera unos minutos/)
  })
  it('400 es un aviso que pide revisar los datos', () => {
    const e = errorDeAcceso(new ErrorApi('Datos inválidos', 400), 'registro')
    expect(e.destino).toBe('aviso')
    expect(e.mensaje).not.toMatch(/Datos inválidos/)
    expect(e.mensaje).toBe('No pudimos aceptar algunos datos. Revisa los campos marcados y vuelve a intentarlo.')
  })
  it.each([[new TypeError('Failed to fetch')], [new ErrorApi('boom', 500)], [new ErrorApi('x', 401)], ['texto']])(
    'red, 5xx y lo desconocido van al snackbar con el mensaje propio (%j)',
    (err) => {
      const e = errorDeAcceso(err, 'registro')
      expect(e.destino).toBe('snackbar')
      expect(e.mensaje).toMatch(/Tus datos siguen aquí/)
    },
  )
  it('nunca devuelve el texto crudo del servidor', () => {
    expect(errorDeAcceso(new ErrorApi('mensaje interno del servidor', 500), 'ingreso').mensaje).not.toMatch(/interno/)
  })
})
