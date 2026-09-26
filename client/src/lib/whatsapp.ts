// numero real de TaJu, confirmado por el negocio - sin '+' ni espacios, formato que exige wa.me
const NUMERO_WHATSAPP = '573192452842'

/**
 * Arma un enlace de wa.me con mensaje prellenado.
 * @param mensaje - Texto a prellenar en el chat, se codifica para la URL.
 * @returns URL lista para abrir en una nueva pestaña.
 */
export function enlaceWhatsApp(mensaje: string): string {
  return `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensaje)}`
}
