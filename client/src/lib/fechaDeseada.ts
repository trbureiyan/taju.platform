import { esDiaConServicio, explicarDiaSinServicio, fechaEnPalabras, primerDiaDisponible } from './horario'
import { MENSAJE_FALTA_FECHA } from './requisitos'

/**
 * La unica regla de la fecha deseada del cliente: la usan la tira de dias y el hook del formulario, para que
 * no puedan discrepar. El servidor no la repite (la fecha real es la que acuerda el taller).
 * @param fecha - `YYYY-MM-DD` o vacio.
 * @param ahora - Momento actual; el minimo se cuenta en dias con servicio y en hora de Bogota.
 * @returns El mensaje (que paso, por que y cual es el siguiente dia disponible), o null si la fecha sirve.
 */
export function validarFechaDeseada(fecha: string, ahora: Date): string | null {
  if (!fecha) return MENSAJE_FALTA_FECHA
  const minimo = primerDiaDisponible(ahora)
  if (fecha < minimo) {
    return `Esa fecha es muy pronto para producirla. El primer día disponible es el ${fechaEnPalabras(minimo)}.`
  }
  if (!esDiaConServicio(fecha)) return explicarDiaSinServicio(fecha)
  return null
}
