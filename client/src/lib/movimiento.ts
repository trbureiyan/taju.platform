import type { Transition } from 'motion/react'

// [DECISION] springs de M3 Expressive tomados de androidx ExpressiveMotionTokens.kt (tokens v0_14_0), no de memoria.
// Viven aqui y no en tokens.css porque CSS no tiene springs; el doc 04 (enmiendas) replica esta tabla.
// Compose define [amortiguacion relativa, rigidez] con masa 1; motion pide amortiguacion absoluta = 2 * ratio * raiz(rigidez).
const M3_EXPRESSIVE = {
  espacialRapido: [0.6, 800],
  espacialNormal: [0.8, 380],
  espacialLento: [0.8, 200],
  efectosRapido: [1.0, 3800],
  efectosNormal: [1.0, 1600],
  efectosLento: [1.0, 800],
} as const

type NombreResorte = keyof typeof M3_EXPRESSIVE

/**
 * Convierte un spring de M3 (ratio de amortiguación, rigidez) a la transición de motion.
 * @param nombre - Spring del esquema expresivo. Espacial rebota (posición, tamaño, giro); efectos no (opacidad, color).
 * @returns Transición tipo spring con masa 1, equivalente a la de Compose.
 */
export function resorte(nombre: NombreResorte): Transition {
  const [ratio, rigidez] = M3_EXPRESSIVE[nombre]
  return { type: 'spring', stiffness: rigidez, damping: 2 * ratio * Math.sqrt(rigidez), mass: 1 }
}

/**
 * Lee una duración de tokens.css (ej. --duracion-normal) en segundos, la unidad de motion.
 * @param variable - Nombre de la custom property, con los dos guiones.
 * @returns Segundos, o undefined si el token no está cargado (tests en jsdom) y motion usa su valor por defecto.
 */
export function duracionToken(variable: string): number | undefined {
  const crudo = getComputedStyle(document.documentElement).getPropertyValue(variable).trim()
  const ms = parseFloat(crudo)
  if (Number.isNaN(ms)) return undefined
  return crudo.endsWith('ms') ? ms / 1000 : ms
}

/**
 * Lee una curva cubic-bezier de tokens.css (ej. --curva-estandar) como el arreglo que pide motion.
 * @param variable - Nombre de la custom property, con los dos guiones.
 * @returns Los cuatro puntos de control, o undefined si el token no está cargado.
 */
export function curvaToken(variable: string): [number, number, number, number] | undefined {
  const crudo = getComputedStyle(document.documentElement).getPropertyValue(variable)
  const numeros = crudo.match(/-?\d*\.?\d+/g)?.map(Number)
  return numeros?.length === 4 ? (numeros as [number, number, number, number]) : undefined
}
