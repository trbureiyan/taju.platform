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

/**
 * Arma un enlace de wa.me hacia el celular de un cliente, para que el taller le escriba.
 * @param celular - Celular colombiano de 10 digitos, sin indicativo (asi se guarda en `Pedido.contacto`).
 * @param mensaje - Texto a prellenar, se codifica para la URL.
 */
export function enlaceWhatsAppA(celular: string, mensaje: string): string {
  return `https://wa.me/57${celular}?text=${encodeURIComponent(mensaje)}`
}

// mismo numero sin indicativo, agrupado como se dicta en Colombia - sale del de wa.me para no duplicarlo
export const NUMERO_WHATSAPP_LEGIBLE = NUMERO_WHATSAPP.slice(2).replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')
