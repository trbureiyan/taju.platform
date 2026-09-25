// [DECISION] datos separados del script de aplicacion - facilita agregar/ajustar muestras sin tocar
// la logica de upsert, y deja claro que esto es contenido de ejemplo, no un fixture de test.

export interface CategoriaSeed {
  nombre: string
  descripcion: string
  familia: 'toppers' | 'superficies' | 'senaletica' | 'papeleria'
  dimensionesBase: { etiqueta: string; valor: number; unidad: 'cm' }[]
}

export interface ProductoSeed {
  categoriaNombre: string
  nombre: string
  descripcionTecnica: string
  especificacionesTecnicas: Record<string, string>
  precio: { unitario: number | null; escalas: { cantidadMinima: number; precioUnitario: number }[] }
}

export const CATEGORIAS: CategoriaSeed[] = [
  {
    nombre: 'Toppers redondos',
    descripcion: 'Cake toppers circulares para tortas de celebracion',
    familia: 'toppers',
    dimensionesBase: [
      { etiqueta: 'Media libra', valor: 22, unidad: 'cm' },
      { etiqueta: 'Libra', valor: 26, unidad: 'cm' },
    ],
  },
  {
    nombre: 'Blondas grabadas',
    descripcion: 'Bases y blondas de MDF con grabado laser',
    familia: 'superficies',
    dimensionesBase: [{ etiqueta: 'Base estandar', valor: 30, unidad: 'cm' }],
  },
  {
    nombre: 'Letreros de bienvenida',
    descripcion: 'Senaletica para eventos y fachadas',
    familia: 'senaletica',
    dimensionesBase: [{ etiqueta: 'Letrero mediano', valor: 40, unidad: 'cm' }],
  },
  {
    nombre: 'Invitaciones y tarjetas',
    descripcion: 'Papeleria personalizada para celebraciones',
    familia: 'papeleria',
    dimensionesBase: [],
  },
]

export const PRODUCTOS: ProductoSeed[] = [
  {
    categoriaNombre: 'Toppers redondos',
    nombre: 'Topper con nombre personalizado',
    descripcionTecnica: 'MDF 3mm calado, acabado natural o pintado',
    especificacionesTecnicas: { material: 'MDF 3mm', acabado: 'Natural o pintado' },
    precio: { unitario: 15000, escalas: [] },
  },
  {
    categoriaNombre: 'Blondas grabadas',
    nombre: 'Blonda MDF calada',
    descripcionTecnica: 'Blonda circular con patron grabado, precio por escala desde 12 unidades',
    especificacionesTecnicas: { material: 'MDF 3mm' },
    // familia superficies: precio por escala, no unitario - ver AGENTS.md
    precio: { unitario: null, escalas: [{ cantidadMinima: 12, precioUnitario: 3500 }] },
  },
  {
    categoriaNombre: 'Letreros de bienvenida',
    nombre: 'Letrero de nombre en madera',
    descripcionTecnica: 'Letras sueltas o base solida en MDF 6mm',
    especificacionesTecnicas: { material: 'MDF 6mm' },
    precio: { unitario: 45000, escalas: [] },
  },
  {
    categoriaNombre: 'Invitaciones y tarjetas',
    nombre: 'Invitacion tipo VIP',
    descripcionTecnica: 'Tarjeta rigida con acabado premium',
    especificacionesTecnicas: { material: 'Cartulina texturizada' },
    precio: { unitario: 2500, escalas: [] },
  },
]

export const USUARIOS = [
  { nombre: 'Cliente de prueba', email: 'cliente@taju.test', rol: 'cliente' as const },
  { nombre: 'Administrador de prueba', email: 'admin@taju.test', rol: 'administrador' as const },
]

// no es un secreto de produccion - solo sirve para loguearse en taju-dev con estos usuarios de muestra
export const PASSWORD_SEED = 'SeedTaju2026!'
