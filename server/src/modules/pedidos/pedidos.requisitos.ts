import type { Familia } from '../../types/index.js'

// [DECISION] que se exige para aceptar una solicitud vive aqui, por familia y en un solo lugar (espejo en
// client/src/lib/requisitos.ts: si cambia una regla, cambia en los dos). Toppers exige referencia: sin ver el diseno no se puede cotizar. La fecha se
// pide a todas porque es una celebracion, y no puede ser anterior a hoy en Bogota. Tambien vive aqui el minimo de
// unidades, que sale de la menor escala del producto. No se valida el dia de la semana: fechaDeseada es un deseo,
// la fecha real es fechaEntrega y la acuerda el taller. Cambiar la regla es tocar esta lista, no el flujo.
const FAMILIAS_CON_REFERENCIA_OBLIGATORIA: readonly Familia[] = ['toppers']

export const MENSAJE_FALTA_FECHA =
  'Nos falta la fecha en que la necesitas. Sin ese dato no podemos saber si llegamos a producirla.'
export const MENSAJE_FALTA_REFERENCIA = 'Adjunta una imagen de referencia. Sin verla no podemos cotizar tu pedido.'
export const MENSAJE_FECHA_PASADA =
  'Esa fecha ya pasó. Elige una a partir de mañana, que es lo mínimo que necesitamos para producir.'

/** Mensaje cuando la cantidad no llega al minimo del producto: que paso, por que y que hacer. */
export function mensajeCantidadMinima(minimo: number): string {
  return `Este producto se pide desde ${minimo} unidades: el precio por escala solo aplica a partir de ahí. Sube la cantidad o escríbenos por WhatsApp si necesitas menos.`
}

/** Minimo de unidades de un producto: la menor cantidadMinima de sus escalas, o 1 si no tiene escalas. */
export function cantidadMinimaDe(escalas: ReadonlyArray<{ cantidadMinima: number }>): number {
  return escalas.length > 0 ? Math.min(...escalas.map((e) => e.cantidadMinima)) : 1
}

const DESFASE_BOGOTA_MS = 5 * 3_600_000
const DIA_MS = 86_400_000

/** Medianoche de Bogota del dia de `ahora`. Colombia no tiene horario de verano: el desfase es fijo (UTC-5). */
export function inicioDelDiaEnBogota(ahora: Date): Date {
  return new Date(Math.floor((ahora.getTime() - DESFASE_BOGOTA_MS) / DIA_MS) * DIA_MS + DESFASE_BOGOTA_MS)
}

interface DatosDeSolicitud {
  familia: Familia
  fechaDeseada: Date | null
  cantidadReferencias: number
  cantidad: number
  cantidadMinima: number
  ahora?: Date
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
  // solo lo barato, sin calendario: la fecha deseada es un deseo, la real es fechaEntrega y la fija el taller
  if (datos.fechaDeseada && datos.fechaDeseada < inicioDelDiaEnBogota(datos.ahora ?? new Date())) {
    faltan.push(MENSAJE_FECHA_PASADA)
  }
  if (datos.cantidad < datos.cantidadMinima) faltan.push(mensajeCantidadMinima(datos.cantidadMinima))
  return faltan
}
