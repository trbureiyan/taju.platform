// vocabulario compartido con el cliente (ver client/src/types/index.ts) - ambos deben decir lo mismo
export type Rol = 'cliente' | 'administrador'

// las cuatro familias de catalogo, no se inventan mas fuera de esta lista
export type Familia = 'toppers' | 'superficies' | 'senaletica' | 'papeleria'

// mismo string en modelo, ruta y UI - sin capa de traduccion entre back y front
export type EstadoPedido = 'pendiente' | 'en_produccion' | 'listo' | 'entregado'

// lo que va firmado dentro del token - sub es el id de Usuario, se llama asi por convencion JWT
export interface JwtPayload {
  sub: string
  email: string
  rol: Rol
}
