import type { Familia } from '../../types/index.js'

// [DECISION] que se exige para aceptar una solicitud vive aqui, por familia y en un solo lugar (espejo en
// client/src/lib/requisitos.ts: si cambia una regla, cambia en los dos). Toppers exige referencia: sin ver el diseno no se puede cotizar. La fecha se
// pide a todas porque es una celebracion. Cambiar la regla es tocar esta lista, no el flujo.
const FAMILIAS_CON_REFERENCIA_OBLIGATORIA: readonly Familia[] = ['toppers']

export const MENSAJE_FALTA_FECHA =
  'Nos falta la fecha en que la necesitas. Sin ese dato no podemos saber si llegamos a producirla.'
export const MENSAJE_FALTA_REFERENCIA = 'Adjunta una imagen de referencia. Sin verla no podemos cotizar tu pedido.'

interface DatosDeSolicitud {
  familia: Familia
  fechaDeseada: Date | null
  cantidadReferencias: number
}

/**
 * Lo que aun le falta a una solicitud para poder aceptarla.
 * @returns Mensajes en voz de marca, uno por cada requisito sin cumplir; vacio si esta completa.
 */
export function faltantesDeSolicitud(datos: DatosDeSolicitud): string[] {
  const faltan: string[] = []
  if (!datos.fechaDeseada) faltan.push(MENSAJE_FALTA_FECHA)
  if (FAMILIAS_CON_REFERENCIA_OBLIGATORIA.includes(datos.familia) && datos.cantidadReferencias < 1) {
    faltan.push(MENSAJE_FALTA_REFERENCIA)
  }
  return faltan
}
