import { FAMILIAS } from '../types'
import type { Familia } from '../types'

/**
 * Convierte el valor de `?familia=` en una familia del dominio.
 * @param valor - Valor crudo del query param, o null si no viene.
 * @returns La familia si coincide exacto con el enum, o null ("Todos") en cualquier otro caso.
 */
export function familiaDesdeParam(valor: string | null): Familia | null {
  // un link viejo o mal escrito no debe romper el catalogo, solo cae a "Todos"
  return FAMILIAS.find((f) => f === valor) ?? null
}
