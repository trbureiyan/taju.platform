import type { DimensionBase } from '../types'

// claves que el taller ya usa en especificacionesTecnicas (editor clave-valor del admin) y el vocabulario de AGENTS.md
const ETIQUETAS: Record<string, string> = {
  ocasion: 'Ocasión',
  material: 'Material',
  acabado: 'Acabado',
  medida: 'Medida',
  referencia: 'Referencia',
  personalizacion: 'Personalización',
  diametro: 'Diámetro',
  altura: 'Altura',
  color: 'Color',
  tematica: 'Temática',
  grosor: 'Grosor',
}

/**
 * Etiqueta legible para una clave de especificaciones técnicas.
 * @param clave - Clave tal como la guarda el admin.
 * @returns La etiqueta conocida, o la clave con la primera letra en mayúscula y sin guiones bajos.
 */
export function etiquetaEspecificacion(clave: string): string {
  const conocida = ETIQUETAS[clave.toLowerCase()]
  if (conocida) return conocida
  const legible = clave.replace(/_/g, ' ').trim()
  return legible.charAt(0).toUpperCase() + legible.slice(1)
}

/**
 * Traduce una dimensión de la categoría a referencia reconocible (voz de marca §2.2).
 * @param d - Dimensión base, ej. { etiqueta: 'Media libra', valor: 22, unidad: 'cm' }.
 * @returns "22 cm, torta de media libra"; si la etiqueta no habla de libras, "30 cm, grande".
 */
export function referenciaMedida(d: DimensionBase): string {
  const etiqueta = d.etiqueta.toLowerCase()
  return /libra/.test(etiqueta)
    ? `${d.valor} ${d.unidad}, torta de ${etiqueta}`
    : `${d.valor} ${d.unidad}, ${etiqueta}`
}
