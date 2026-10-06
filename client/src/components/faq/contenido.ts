import { horaEnPalabras } from '../../lib/horario'
import { formatearPesos } from '../../lib/precio'
import {
  ANTICIPO_PORCENTAJE,
  CONTACTO_USUAL_MINUTOS,
  DOMICILIO_BOGOTA_USUAL,
  HORARIO_SEMANAL,
  PLAZO_CONTACTO_HORAS,
  TARIFAS_DOMICILIO,
} from '../../lib/politicas'
import { RESPONSABLE } from '../../lib/politicaDatos'

// fuente única del texto de /preguntas-frecuentes, como components/vitrina/contenido.ts: la página solo lo pinta.
// Los números salen de lib/politicas.ts y los datos de contacto de lib/politicaDatos.ts, nunca se repiten aquí.
// [!] Solo va lo que el taller confirmó. El tiempo de producción NO se afirma: no lo confirmó, y la voz de marca
// prohíbe prometer plazos que el taller no pueda cumplir (.docs/branding/03-voz-de-marca.md).

export interface PreguntaFrecuente {
  id: string
  pregunta: string
  respuesta: string[]
  enlace?: { texto: string; a: string }
}

export interface GrupoFaq {
  titulo: string
  preguntas: PreguntaFrecuente[]
}

const DIAS = ['domingos', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados']

// agrupa días seguidos con el mismo horario: "lunes a viernes de 8:00 a. m. a 6:00 p. m."
function horarioEnPalabras(): string {
  const tramos: string[] = []
  let i = 1
  while (i <= 6) {
    const h = HORARIO_SEMANAL[i]
    if (!h) {
      i += 1
      continue
    }
    let j = i
    while (j + 1 <= 6 && HORARIO_SEMANAL[j + 1]?.apertura === h.apertura && HORARIO_SEMANAL[j + 1]?.cierre === h.cierre) j += 1
    const dias = i === j ? DIAS[i] : `${DIAS[i]} a ${DIAS[j]}`
    tramos.push(`${dias} de ${horaEnPalabras(h.apertura)} a ${horaEnPalabras(h.cierre)}`)
    i = j + 1
  }
  const sinServicio = [0, 1, 2, 3, 4, 5, 6].filter((d) => !HORARIO_SEMANAL[d]).map((d) => DIAS[d])
  return `${tramos.join(', ')}${sinServicio.length ? `; ${sinServicio.join(' y ')} no hay servicio` : ''}`
}

const tarifasDomicilio = TARIFAS_DOMICILIO.map(
  (t) => `${t.zona}: ${t.hasta ? `entre ${formatearPesos(t.desde)} y ${formatearPesos(t.hasta)}` : formatearPesos(t.desde)}`,
).join('. ')

export const GRUPOS_FAQ: GrupoFaq[] = [
  {
    titulo: 'Cómo pedir',
    preguntas: [
      {
        id: 'como-pedir',
        pregunta: '¿Cómo hago un pedido?',
        respuesta: [
          'Elige el producto en el catálogo y envía tu solicitud en cuatro pasos: qué necesitas, cómo lo imaginas, cuándo y dónde, y un repaso final. Necesitas una cuenta para que podamos escribirte y para que puedas seguir tu solicitud.',
          'Enviar la solicitud no te compromete: la revisamos y la confirmamos contigo antes de producir.',
        ],
        enlace: { texto: 'Ver el catálogo', a: '/catalogo' },
      },
      {
        id: 'tiempo-respuesta',
        pregunta: '¿Cuánto tardan en escribirme?',
        respuesta: [
          `Normalmente te escribimos por WhatsApp entre ${CONTACTO_USUAL_MINUTOS} minutos y ${PLAZO_CONTACTO_HORAS} horas de atención. Si envías tu solicitud fuera de horario, te escribimos cuando abramos.`,
        ],
      },
      {
        id: 'horario',
        pregunta: '¿Cuál es el horario de atención?',
        respuesta: [`Atendemos ${horarioEnPalabras()}. Los lunes festivos tampoco hay servicio.`],
      },
      {
        id: 'cancelar',
        pregunta: '¿Puedo cancelar mi solicitud?',
        respuesta: [
          'Sí. Puedes cancelarla desde Mis pedidos mientras esté en revisión. Si ya la confirmamos, escríbenos por WhatsApp.',
        ],
        enlace: { texto: 'Ir a Mis pedidos', a: '/mis-pedidos' },
      },
      {
        id: 'minimo-blondas',
        pregunta: '¿Hay una cantidad mínima?',
        respuesta: [
          'Las blondas grabadas se piden desde 12 unidades. En el resto de productos, el catálogo indica la cantidad desde la que se pide.',
        ],
      },
      {
        id: 'referencias',
        pregunta: '¿Qué imágenes de referencia puedo subir?',
        respuesta: [
          'Hasta 3 imágenes en JPG, PNG o WebP, de máximo 5 MB cada una. En los cake toppers la imagen de referencia es obligatoria: nos ayuda a entender qué tienes en mente.',
        ],
      },
    ],
  },
  {
    titulo: 'Pagos y cambios',
    preguntas: [
      {
        id: 'pago',
        pregunta: '¿Cómo se paga?',
        respuesta: [
          `Para empezar a producir pedimos un anticipo, normalmente del ${ANTICIPO_PORCENTAJE} % del valor acordado. Aceptamos pagos en Efectivo, Nequi, Bancolombia y Bre-B.`,
          'La plataforma no cobra: el taller registra tu anticipo y te indica por WhatsApp cómo pagar.',
        ],
      },
      {
        id: 'reembolsos',
        pregunta: '¿Hacen reembolsos o devoluciones?',
        respuesta: [
          'No hacemos reembolsos ni devoluciones. Por eso revisamos contigo todos los detalles antes de producir.',
          'Si tu pedido llega distinto de lo que acordamos, escríbenos por WhatsApp y lo revisamos.',
        ],
      },
    ],
  },
  {
    titulo: 'Entrega',
    preguntas: [
      {
        id: 'recoger-o-domicilio',
        pregunta: '¿Puedo recoger mi pedido o piden domicilio?',
        respuesta: [
          `Puedes elegir las dos. Para recoger, estamos en ${RESPONSABLE.direccion}. La fecha de entrega la acordamos contigo por WhatsApp.`,
        ],
      },
      {
        id: 'domicilio',
        pregunta: '¿Cuánto cuesta el domicilio?',
        respuesta: [
          `El valor del domicilio lo paga quien pide y depende de la zona. ${tarifasDomicilio}.`,
          `A otras ciudades depende del destino; a Bogotá suele ser de ${formatearPesos(DOMICILIO_BOGOTA_USUAL)}. Te confirmamos el valor antes de enviar.`,
        ],
      },
      {
        id: 'envios',
        pregunta: '¿Hacen envíos fuera de Neiva?',
        respuesta: ['Sí. El valor depende de la ciudad y te lo confirmamos por WhatsApp antes de enviar.'],
      },
    ],
  },
  {
    titulo: 'Tu cuenta y tus datos',
    preguntas: [
      {
        id: 'por-que-cuenta',
        pregunta: '¿Por qué necesito una cuenta?',
        respuesta: ['Para saber quién envía cada solicitud, escribirte y que puedas seguirla en Mis pedidos.'],
      },
      {
        id: 'datos',
        pregunta: '¿Qué hacen con mis datos?',
        respuesta: [
          'Los usamos para gestionar tu cuenta y tus pedidos. En el texto completo explicamos qué guardamos, con quién lo compartimos y cómo ejercer tus derechos.',
        ],
        enlace: { texto: 'Cómo tratamos tus datos', a: '/datos' },
      },
    ],
  },
]
