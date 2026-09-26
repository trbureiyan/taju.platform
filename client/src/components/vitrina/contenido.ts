import { FAMILIAS, ETIQUETAS_FAMILIA } from '../../types'
import type { Familia } from '../../types'
import type { Silueta } from './PiezaSilueta'

export interface ContenidoFamilia {
  familia: Familia
  nombre: string
  descripcion: string
  // [?] los tres datos de cada familia estan pendientes de validar con el taller (spec §13)
  datos: [string, string, string]
  cta: string
  claseFondo: string
  silueta: Silueta
}

// clases literales para que Tailwind las encuentre al escanear; apuntan a --familia-*-fondo en tokens.css
const POR_FAMILIA: Record<Familia, Omit<ContenidoFamilia, 'familia' | 'nombre'>> = {
  toppers: {
    descripcion:
      'Cake toppers en MDF y acrílico con el nombre, la edad o el personaje que quieras. Te ayudamos a elegir el tamaño según tu torta.',
    datos: ['MDF y acrílico', 'Con nombre y edad', 'A la medida de tu torta'],
    cta: 'Ver los toppers',
    claseFondo: 'bg-familia-toppers',
    silueta: 'topper',
  },
  superficies: {
    descripcion: 'Blondas de MDF grabadas y bases para tortas, en las medidas de repostería que ya conoces.',
    datos: ['MDF grabado', 'De 15 a 40 cm', 'Desde 12 unidades'],
    cta: 'Ver blondas y bases',
    claseFondo: 'bg-familia-superficies',
    silueta: 'blonda',
  },
  senaletica: {
    descripcion: 'Letreros, banners, letras en vinilo y números para ambientar tu evento.',
    datos: ['Letreros y banners', 'Letras en vinilo', 'Números para montaje'],
    cta: 'Ver la señalética',
    claseFondo: 'bg-familia-senaletica',
    silueta: 'letras',
  },
  papeleria: {
    descripcion: 'Invitaciones tipo pase VIP, llaveros, cajas y vasos para que cada detalle combine con la celebración.',
    datos: ['Invitaciones tipo pase VIP', 'Llaveros y cajas', 'Vasos personalizados'],
    cta: 'Ver la papelería',
    claseFondo: 'bg-familia-papeleria',
    silueta: 'pase',
  },
}

// orden y nombres salen del enum y de ETIQUETAS_FAMILIA: no existe una segunda lista de familias escrita a mano
export const CONTENIDO_FAMILIAS: ContenidoFamilia[] = FAMILIAS.map((familia) => ({
  familia,
  nombre: ETIQUETAS_FAMILIA[familia],
  ...POR_FAMILIA[familia],
}))

/**
 * Ruta del catálogo filtrado por familia.
 * @param familia - Familia del enum.
 * @returns `/catalogo?familia=<familia>`, el formato que lee CatalogoPage.
 */
export function rutaFamilia(familia: Familia): string {
  return `/catalogo?familia=${familia}`
}
