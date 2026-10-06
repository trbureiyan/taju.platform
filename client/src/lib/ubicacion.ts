// ubicación del taller para el mapa del pie. La dirección en texto vive en RESPONSABLE (lib/politicaDatos.ts):
// se toma de ahí para que /datos y el pie nunca digan cosas distintas
export const UBICACION_TALLER = { lat: 2.9406778, lng: -75.2503933 } as const

const COORDENADAS = `${UBICACION_TALLER.lat},${UBICACION_TALLER.lng}`

/** Dirección del mapa para el iframe del pie (no necesita llave de API). */
export function urlMapaIncrustado(): string {
  return `https://www.google.com/maps?q=${COORDENADAS}&z=17&output=embed`
}

/** Abre la ubicación en la app o en el sitio de Google Maps. */
export function enlaceComoLlegar(): string {
  return `https://www.google.com/maps/search/?api=1&query=${COORDENADAS}`
}
