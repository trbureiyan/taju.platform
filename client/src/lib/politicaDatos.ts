// espejo de VERSION_POLITICA_DATOS en server/src/modules/auth/auth.service.ts: se suben juntas cuando el texto cambia de fondo
export const VERSION_POLITICA_DATOS = '2026-10-05'

// [DECISION] los datos del responsable viven aquí y no en la página: un solo lugar para completar y una prueba que
// bloquea el paso a main mientras falten. Costo: el texto de /datos es un borrador hasta entonces.
export const RESPONSABLE = {
  nombre: '[PENDIENTE] nombre o razón social del taller',
  nit: '[PENDIENTE] NIT o documento',
  direccion: '[PENDIENTE] dirección del taller en Neiva',
  telefono: '[PENDIENTE] teléfono',
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
      `${RESPONSABLE.nombre}, ${RESPONSABLE.nit}. Dirección: ${RESPONSABLE.direccion}. Teléfono: ${RESPONSABLE.telefono}. Correo: ${RESPONSABLE.correo}.`,
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
      'Con los servicios que hacen funcionar la plataforma (alojamiento, base de datos y almacenamiento de imágenes). Solo reciben lo necesario para prestarnos el servicio.',
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
