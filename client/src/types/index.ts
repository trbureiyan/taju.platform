// ─── Enums de dominio ───────────────────────────────────────────────────────
// espejo exacto de server/src/types - mismo string en modelo, ruta y UI, sin traduccion en el medio
export type Rol = 'cliente' | 'administrador'

export type Familia = 'toppers' | 'superficies' | 'senaletica' | 'papeleria'

export type EstadoPedido = 'pendiente' | 'en_produccion' | 'listo' | 'entregado'

// ─── Entidades ────────────────────────────────────────────────────────────────

export interface Usuario {
  _id: string
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

export interface Producto {
  _id: string
  nombre: string
  descripcionTecnica: string
  categoria: Categoria
  especificacionesTecnicas: Record<string, string>
  imagenes: string[]
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
  esDimensionPersonalizada: boolean
  fechaSolicitud: string
  fechaEstimadaEntrega: string | null
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
  pendiente: 'Pendiente',
  en_produccion: 'En producción',
  listo: 'Listo para entrega',
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
  pendiente: 'bg-pedido-pendiente-fondo text-pedido-pendiente-texto',
  en_produccion: 'bg-pedido-produccion-fondo text-pedido-produccion-texto',
  listo: 'bg-pedido-listo-fondo text-pedido-listo-texto',
  entregado: 'bg-pedido-entregado-fondo text-pedido-entregado-texto',
}
