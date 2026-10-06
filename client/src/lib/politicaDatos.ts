// espejo de VERSION_POLITICA_DATOS en server/src/modules/auth/auth.service.ts: se suben juntas cuando el texto cambia de fondo
export const VERSION_POLITICA_DATOS = '2026-10-06'

// [DECISION] solo se publica lo necesario: el art. 12 de la Ley 1581 pide identificar al responsable, una dirección
// (física o electrónica) y un teléfono. El teléfono ya es público (es el WhatsApp del sitio); lo demás queda con
// [PENDIENTE] hasta que TaJú confirme qué se publica. Una prueba bloquea el paso a main mientras quede alguno.
export const RESPONSABLE = {
  nombre: 'TaJú Neiva [PENDIENTE: confirmar si se publica el nombre completo de la titular]',
  direccion: 'Neiva (Huila) [PENDIENTE: confirmar qué dirección se publica]',
  telefono: '319 245 2842',
  correo: '[PENDIENTE] correo para consultas y reclamos',
} as const

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
      'Con los servicios que hacen funcionar la plataforma: MongoDB Atlas (base de datos), Cloudinary (imágenes), Render y Vercel (alojamiento), y WhatsApp, el canal por el que te escribimos. Solo reciben lo necesario para prestarnos el servicio y pueden guardar la información en servidores fuera de Colombia.',
    ],
  },
  {
    titulo: 'Tus derechos',
    parrafos: [
      'Puedes conocer, actualizar y rectificar tus datos, pedir prueba de tu autorización, revocarla, pedir que borremos tus datos y acceder a ellos gratis. Escríbenos al correo del responsable: respondemos las consultas en máximo 10 días hábiles.',
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

/** Textos que aún llevan un marcador de pendiente (`[PENDIENTE]`, `[POR CONFIRMAR]`, `TODO:`...), sin distinguir mayúsculas. */
export function marcadoresPendientes(textos: string[] = textosDeLaPolitica()): string[] {
  return textos.filter((t) => MARCADOR_PENDIENTE.test(t))
}
