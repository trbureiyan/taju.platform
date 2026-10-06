// espejo de VERSION_POLITICA_DATOS en server/src/modules/auth/auth.service.ts: se suben juntas cuando el texto cambia de fondo
export const VERSION_POLITICA_DATOS = '2026-10-06.2'

// [DECISION] solo se publica lo necesario: el art. 12 de la Ley 1581 pide identificar al responsable, una dirección
// (física o electrónica) y un teléfono. TaJú confirmó publicar estos datos. Una prueba bloquea el paso a main si vuelve
// a quedar algo con [PENDIENTE].
export const RESPONSABLE = {
  nombre: 'Jennifer Tatiana Barrero Bustos, titular de TaJú Neiva',
  direccion: 'Cra 49 A # 19-19, barrio Pastrana, Neiva (Huila)',
  telefono: '319 245 2842',
  correo: 'tajubyjuancrack@gmail.com',
} as const

// [!] ANALÍTICA, COOKIES Y TRACKING: hoy la plataforma no los usa (el token vive en memoria, sin cookies propias ni
// analítica), y por eso este texto no habla de ellos. Si algún día se agrega analítica, un píxel de publicidad o
// cualquier cosa que guarde cookies o identificadores, antes de activarla hay que: (1) pedir consentimiento previo y
// expreso (art. 9 de la Ley 1581), sin cargar la herramienta hasta que la persona acepte; (2) agregar aquí qué datos
// recoge, para qué y con quién se comparten; (3) subir VERSION_POLITICA_DATOS aquí y en el servidor; (4) escribir una
// política de cookies si corresponde. Lo mismo vale para cualquier contenido de terceros embebido (el mapa del pie
// carga contenido de Google). Pendientes de términos y condiciones y de este tema: issue #98 del repositorio.
export interface SeccionPolitica {
  titulo: string
  parrafos: string[]
}

export const TEXTOS_POLITICA: SeccionPolitica[] = [
  {
    titulo: 'Quién es el responsable',
    parrafos: [
      `${RESPONSABLE.nombre}. Dirección: ${RESPONSABLE.direccion}. Teléfono: ${RESPONSABLE.telefono}. Correo: ${RESPONSABLE.correo}.`,
    ],
  },
  {
    titulo: 'Qué datos guardamos',
    parrafos: [
      'Tu nombre, tu correo y tu contraseña (esta última guardada de forma que nadie puede leerla). Al pedir, también tu celular, la dirección de entrega, las imágenes de referencia que subas y el texto de personalización que escribas.',
    ],
  },
  {
    titulo: 'Para qué los usamos',
    parrafos: [
      'Para crear tu cuenta, recibir tus solicitudes, escribirte por WhatsApp sobre ellas, producir y entregar tus pedidos, y que puedas seguirlos. No usamos tus datos para otra cosa sin pedirte permiso antes.',
    ],
  },
  {
    titulo: 'Con quién los compartimos',
    parrafos: [
      'Con los servicios que hacen funcionar la plataforma: MongoDB Atlas (base de datos), Cloudinary (imágenes), Render y Vercel (alojamiento), Google Maps (el mapa de nuestra ubicación en el pie de página) y WhatsApp, el canal por el que te escribimos. Solo reciben lo necesario para prestarnos el servicio y pueden guardar la información en servidores fuera de Colombia.',
    ],
  },
  {
    titulo: 'Cuánto tiempo guardamos tus datos',
    parrafos: [
      'Guardamos tus datos mientras tu cuenta exista. Hoy no los borramos automáticamente por inactividad. Si quieres que borremos tu cuenta y tus datos, escríbenos; los borramos, salvo lo que el taller deba conservar por obligaciones legales.',
    ],
  },
  {
    titulo: 'Tus derechos',
    parrafos: [
      'Puedes conocer, actualizar y rectificar tus datos, pedir prueba de tu autorización, revocarla, pedir que borremos tus datos y acceder a ellos gratis. Escríbenos al correo del responsable: respondemos las consultas en máximo 10 días hábiles.',
    ],
  },
  {
    titulo: 'Datos de menores de edad',
    parrafos: [
      'Esta plataforma es para personas mayores de edad. Si tu pedido lleva datos de una persona menor de edad, como su nombre o su edad en un topper, los incluyes tú como mayor de edad responsable, y los usamos solo para elaborar el pedido.',
    ],
  },
  {
    titulo: 'Si no estás conforme',
    parrafos: [
      'Si crees que no atendimos bien una consulta o un reclamo sobre tus datos, puedes acudir a la Superintendencia de Industria y Comercio, la autoridad de protección de datos personales en Colombia.',
    ],
  },
  {
    titulo: 'Cambios a este texto',
    parrafos: [
      'Si cambiamos este texto, publicamos aquí la nueva versión con su fecha. Guardamos con tu cuenta la versión que aceptaste.',
    ],
  },
  {
    titulo: 'Tu autorización',
    parrafos: [
      'Al crear tu cuenta marcas la casilla de autorización. Guardamos esa aceptación con su fecha y la versión de este texto, para poder mostrártela si la pides.',
    ],
  },
]

// cubre las formas comunes de dejar algo por completar; sin la palabra suelta "todo" para no marcar prosa normal
const MARCADOR_PENDIENTE = /\[(?:pendiente|por confirmar|confirmar|todo)\]|\bpendiente\b|\btodo:/i

/** Lista exacta que la compuerta revisa por defecto: responsable, títulos y párrafos. Sirve para que nadie la reduzca sin que una prueba lo note. */
export function textosDeLaPolitica(): string[] {
  return [...Object.values(RESPONSABLE), ...TEXTOS_POLITICA.flatMap((s) => [s.titulo, ...s.parrafos])]
}

/**
 * Textos que aún llevan un marcador de pendiente (`[PENDIENTE]`, `[POR CONFIRMAR]`, `TODO:`...), sin distinguir mayúsculas.
 * @param textos - Lista a revisar; si se pasa, reemplaza el resultado de `textosDeLaPolitica()`, que es el valor por defecto.
 * @returns Los textos de la lista que contienen un marcador; vacío cuando no queda nada pendiente.
 */
export function marcadoresPendientes(textos: string[] = textosDeLaPolitica()): string[] {
  return textos.filter((t) => MARCADOR_PENDIENTE.test(t))
}
