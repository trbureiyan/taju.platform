import { ErrorApi } from './api'

// espejo de server/src/modules/auth/auth.controller.ts: nombre 2 a 120, correo válido, contraseña de 8 o más.
// Si el servidor cambia una regla, cambiarla aquí o el formulario acepta lo que el servidor rechaza.
const NOMBRE_MIN = 2
const NOMBRE_MAX = 120
export const CONTRASENA_MIN = 8
// [DECISION] más estricto que "algo@algo.algo": se acerca al z.string().email() de Zod v4 del servidor para que un correo
// mal escrito falle en el campo y no como aviso vago. Costo: si Zod cambia su regla, se ajusta aquí.
const REGEX_CORREO =
  /^(?:[A-Za-z0-9_'+-]+\.)*[A-Za-z0-9_'+-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/

/**
 * Valida el nombre del registro.
 * @param valor - Nombre tal como se escribió; se recorta antes de medirlo (2 a 120 caracteres).
 * @returns El mensaje de error, o null si el nombre es válido.
 */
export function validarNombre(valor: string): string | null {
  const nombre = valor.trim()
  if (nombre.length < NOMBRE_MIN) return 'Escribe tu nombre: así sabemos quién envía cada solicitud.'
  if (nombre.length > NOMBRE_MAX) return `Tu nombre es muy largo: usa máximo ${NOMBRE_MAX} caracteres.`
  return null
}

/**
 * Valida el correo con la misma forma que acepta el servidor.
 * @param valor - Correo tal como se escribió; se recorta antes de validarlo.
 * @returns El mensaje de error, o null si el correo es válido.
 */
export function validarCorreo(valor: string): string | null {
  const correo = valor.trim()
  if (!correo) return 'Escribe tu correo: es con lo que ingresas a tu cuenta.'
  if (!REGEX_CORREO.test(correo)) return 'Ese correo no parece completo. Revisa que tenga @ y un dominio, como nombre@correo.com.'
  return null
}

/**
 * Valida la contraseña al registrarse. No se recorta: los espacios cuentan.
 * @param valor - Contraseña escrita; mínimo `CONTRASENA_MIN` caracteres.
 * @returns El mensaje de error, o null si es válida.
 */
export function validarContrasena(valor: string): string | null {
  if (valor.length === 0) return 'Elige una contraseña: protege tu cuenta y tus pedidos.'
  if (valor.length < CONTRASENA_MIN) {
    return `Tu contraseña necesita ${CONTRASENA_MIN} caracteres o más. Ahora tiene ${valor.length}.`
  }
  return null
}

/**
 * Valida la contraseña al ingresar: el servidor no mide su fuerza, solo exige que venga algo.
 * @param valor - Contraseña escrita.
 * @returns El mensaje de error, o null si no está vacía.
 */
export function validarContrasenaIngreso(valor: string): string | null {
  return valor.length === 0 ? 'Escribe tu contraseña para ingresar.' : null
}

export type DestinoDeError = 'correo' | 'aviso' | 'snackbar'

const MENSAJES = {
  correoRepetido: 'Ese correo ya tiene una cuenta. Ingresa con él para ver tus pedidos.',
  credenciales: 'No pudimos ingresar con esos datos. Revisa tu correo y tu contraseña e intenta de nuevo.',
  demasiados: 'Hubo demasiados intentos desde esta conexión. Espera unos minutos y vuelve a intentarlo.',
  revisar: 'No pudimos aceptar algunos datos. Revisa los campos marcados y vuelve a intentarlo.',
  fallo:
    'No pudimos completar esto desde nuestro lado. Tus datos siguen aquí: intenta de nuevo en unos segundos o escríbenos por WhatsApp.',
} as const

/**
 * Traduce un fallo del servidor a un mensaje propio y dice dónde mostrarlo.
 * @param err - Lo que lanzó la petición: un `ErrorApi` con el código HTTP, o cualquier otro error (red caída, etc.).
 * @param contexto - Vista que hizo la petición; el mismo código significa cosas distintas en registro e ingreso.
 * @returns El destino del mensaje (`correo`, `aviso` o `snackbar`) y el texto propio a mostrar.
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
