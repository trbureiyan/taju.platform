import type { Familia } from '../types'

// espejo de server/src/modules/pedidos/pedidos.requisitos.ts: si cambia una regla, cambia en los dos lados.
// El formulario la usa para avisar antes del envio; el server es quien la hace cumplir.
const FAMILIAS_CON_REFERENCIA_OBLIGATORIA: readonly Familia[] = ['toppers']

export const MENSAJE_FALTA_FECHA =
  'Nos falta la fecha en que la necesitas. Sin ese dato no podemos saber si llegamos a producirla.'
export const MENSAJE_FALTA_REFERENCIA = 'Adjunta una imagen de referencia. Sin verla no podemos cotizar tu pedido.'

export const REGEX_CELULAR = /^3\d{9}$/
export const MENSAJE_CELULAR =
  'Escribe tu celular de 10 dígitos, empieza en 3. Es el número por el que te escribimos.'

/** @returns true si la familia no se puede cotizar sin ver una imagen de referencia. */
export function exigeReferencia(familia: Familia): boolean {
  return FAMILIAS_CON_REFERENCIA_OBLIGATORIA.includes(familia)
}

/**
 * Deja solo los digitos del celular y quita el indicativo de Colombia si viene pegado.
 * Un numero incompleto se devuelve tal cual, para que la validacion diga que falta.
 */
export function normalizarCelular(texto: string): string {
  const digitos = texto.replace(/\D/g, '')
  return digitos.length === 12 && digitos.startsWith('57') ? digitos.slice(2) : digitos
}
