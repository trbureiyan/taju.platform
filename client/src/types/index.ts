// ─── Enums de dominio ───────────────────────────────────────────────────────
// espejo exacto de server/src/types - mismo string en modelo, ruta y UI, sin traduccion en el medio
export const ROLES = ['cliente', 'administrador'] as const
export type Rol = (typeof ROLES)[number]

// destino post-login/registro y a donde manda ProtectedRoute cuando el rol autenticado no es el que pide la
// ruta - un solo mapa para que ambos casos siempre esten de acuerdo en donde vive cada rol
export const RUTA_INICIO_POR_ROL: Record<Rol, string> = {
  cliente: '/mis-pedidos',
  administrador: '/admin/pedidos',
}

export const FAMILIAS = ['toppers', 'superficies', 'senaletica', 'papeleria'] as const
export type Familia = (typeof FAMILIAS)[number]

export const ESTADOS_PEDIDO = [
  'recibido',
  'en_revision',
  'confirmado',
  'en_produccion',
  'listo_para_entrega',
  'entregado',
] as const
export type EstadoPedido = (typeof ESTADOS_PEDIDO)[number]

// ─── Entidades ────────────────────────────────────────────────────────────────

export interface Usuario {
  _id: string
  nombre: string
  email: string
  rol: Rol
}

export interface DimensionBase {
  etiqueta: string
  valor: number
  unidad: 'cm'
}

export interface Categoria {
  _id: string
  nombre: string
  descripcion: string
  familia: Familia
  dimensionesBase: DimensionBase[]
  activo: boolean
}

// lo que realmente devuelve el populate('categoria', 'nombre familia dimensionesBase') del server -
// no es una Categoria completa (sin descripcion ni activo), no prometer campos que la API no manda
export interface CategoriaPoblada {
  _id: string
  nombre: string
  familia: Familia
  dimensionesBase: DimensionBase[]
}

export interface EscalaPrecio {
  cantidadMinima: number
  precioUnitario: number
}

// unitario para las tres familias normales, escalas solo para `superficies` (minimo 12 unidades) - ver AGENTS.md
export interface Precio {
  unitario: number | null
  escalas: EscalaPrecio[]
}

export interface Producto {
  _id: string
  nombre: string
  descripcionTecnica: string
  categoria: CategoriaPoblada
  especificacionesTecnicas: Record<string, string>
  imagenes: string[]
  precio: Precio
  activo: boolean
}

export interface ImagenReferencia {
  nombreOriginal: string
  url: string
}

// cliente union type: string cuando viene sin populate, objeto cuando el admin lo pide populado -
// PedidoAdmin abajo fija el segundo caso para no repetir el chequeo en cada componente de admin
export interface Pedido {
  _id: string
  cliente: string | { _id: string; email: string }
  categoria: {
    _id: string
    nombre: string
    familia: Familia
  }
  descripcion: string
  dimensiones: {
    valor: number
    unidad: 'cm'
    esDimensionPersonalizada: boolean
  }
  cantidad: number
  colores: string
  materiales: string
  imagenesReferencia: ImagenReferencia[]
  estado: EstadoPedido
  fechaSolicitud: string
  fechaEntrega: string | null
  confirmacionDimensionPersonalizada: boolean
}

// en el panel de admin el pedido siempre viene con el cliente populado, nunca solo el id
export type PedidoAdmin = Omit<Pedido, 'cliente'> & {
  cliente: { _id: string; email: string }
}

// ─── Presentacion ─────────────────────────────────────────────────────────────
// estos tres mapas son la unica fuente de texto/color por estado o familia - ningun componente
// escribe "En producción" o una clase de color suelta, siempre se busca aqui

// la etiqueta se deriva de este mapa, nunca se escribe suelta en un componente
export const ETIQUETAS_ESTADO: Record<EstadoPedido, string> = {
  recibido: 'Recibido',
  en_revision: 'En revisión',
  confirmado: 'Confirmado',
  en_produccion: 'En producción',
  listo_para_entrega: 'Listo para entrega',
  entregado: 'Entregado',
}

export const ETIQUETAS_FAMILIA: Record<Familia, string> = {
  toppers: 'Toppers',
  superficies: 'Superficies',
  senaletica: 'Señalética',
  papeleria: 'Papelería',
}

// nombres de clase que apuntan a tailwind.config.js -> tokens.css, nunca colores crudos
export const CLASES_ESTADO: Record<EstadoPedido, string> = {
  recibido: 'bg-pedido-recibido-fondo text-pedido-recibido-texto',
  en_revision: 'bg-pedido-revision-fondo text-pedido-revision-texto',
  confirmado: 'bg-pedido-confirmado-fondo text-pedido-confirmado-texto',
  en_produccion: 'bg-pedido-produccion-fondo text-pedido-produccion-texto',
  listo_para_entrega: 'bg-pedido-listo-fondo text-pedido-listo-texto',
  entregado: 'bg-pedido-entregado-fondo text-pedido-entregado-texto',
}
