import { ErrorApi } from './api'

// espejo de server/src/modules/auth/auth.controller.ts: nombre 2 a 120, correo válido, contraseña de 8 o más.
// Si el servidor cambia una regla, cambiarla aquí o el formulario acepta lo que el servidor rechaza.
export const NOMBRE_MIN = 2
export const NOMBRE_MAX = 120
export const CONTRASENA_MIN = 8
const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validarNombre(valor: string): string | null {
  const nombre = valor.trim()
  if (nombre.length < NOMBRE_MIN) return 'Escribe tu nombre: así sabemos quién envía cada solicitud.'
  if (nombre.length > NOMBRE_MAX) return `Tu nombre es muy largo: usa máximo ${NOMBRE_MAX} caracteres.`
  return null
}

export function validarCorreo(valor: string): string | null {
  const correo = valor.trim()
  if (!correo) return 'Escribe tu correo: es con lo que ingresas a tu cuenta.'
  if (!REGEX_CORREO.test(correo)) return 'Ese correo no parece completo. Revisa que tenga @ y un dominio, como nombre@correo.com.'
  return null
}

export function validarContrasena(valor: string): string | null {
  if (valor.length === 0) return 'Elige una contraseña: protege tu cuenta y tus pedidos.'
  if (valor.length < CONTRASENA_MIN) {
    return `Tu contraseña necesita ${CONTRASENA_MIN} caracteres o más. Ahora tiene ${valor.length}.`
  }
  return null
}

// el servidor no valida la fuerza al ingresar, solo que venga algo
export function validarContrasenaIngreso(valor: string): string | null {
  return valor.length === 0 ? 'Escribe tu contraseña para ingresar.' : null
}

export type DestinoDeError = 'correo' | 'aviso' | 'snackbar'

const MENSAJES = {
  correoRepetido: 'Ese correo ya tiene una cuenta. Ingresa con él para ver tus pedidos.',
  credenciales: 'No pudimos ingresar con esos datos. Revisa tu correo y tu contraseña e intenta de nuevo.',
  demasiados: 'Hubo demasiados intentos desde esta conexión. Espera unos minutos y vuelve a intentarlo.',
  revisar: 'Algo de lo que escribiste no pasó. Revisa los campos y vuelve a intentarlo.',
  fallo:
    'No pudimos completar esto desde nuestro lado. Tus datos siguen aquí: intenta de nuevo en unos segundos o escríbenos por WhatsApp.',
} as const

/**
 * Traduce un fallo del servidor a un mensaje propio y dice dónde mostrarlo.
 * [DECISION] se decide por código HTTP y nunca se muestra el texto del servidor: así no hay que tocar auth para cambiar
 * la voz, y un mensaje en voseo o con lógica interna no llega al cliente. Costo: un código nuevo cae en el mensaje de respaldo.
 */
export function errorDeAcceso(
  err: unknown,
  contexto: 'registro' | 'ingreso',
): { destino: DestinoDeError; mensaje: string } {
  if (err instanceof ErrorApi) {
    if (err.estado === 409 && contexto === 'registro') return { destino: 'correo', mensaje: MENSAJES.correoRepetido }
    if (err.estado === 401 && contexto === 'ingreso') return { destino: 'aviso', mensaje: MENSAJES.credenciales }
    if (err.estado === 429) return { destino: 'snackbar', mensaje: MENSAJES.demasiados }
    if (err.estado === 400) return { destino: 'aviso', mensaje: MENSAJES.revisar }
  }
  return { destino: 'snackbar', mensaje: MENSAJES.fallo }
}
