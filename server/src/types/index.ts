// vocabulario compartido con el cliente (ver client/src/types/index.ts) - ambos deben decir lo mismo.
export const ROLES = ['cliente', 'administrador'] as const
export type Rol = (typeof ROLES)[number]

// las cuatro familias de catalogo, no se inventan mas fuera de esta lista
export const FAMILIAS = ['toppers', 'superficies', 'senaletica', 'papeleria'] as const
export type Familia = (typeof FAMILIAS)[number]

// el flujo feliz, en orden; ESTADOS_PEDIDO le suma las salidas que no son un paso del flujo
export const FLUJO_PEDIDO = [
  'recibido',
  'en_revision',
  'confirmado',
  'en_produccion',
  'listo_para_entrega',
  'entregado',
] as const

// mismo string en modelo, ruta y UI - sin capa de traduccion entre back y front
export const ESTADOS_PEDIDO = [...FLUJO_PEDIDO, 'cancelado'] as const
export type EstadoPedido = (typeof ESTADOS_PEDIDO)[number]

export const METODOS_ENTREGA = ['recoger', 'domicilio'] as const
export type MetodoEntrega = (typeof METODOS_ENTREGA)[number]

// medios con los que hoy se acuerda el anticipo; la plataforma no mueve dinero, solo deja constancia
export const MEDIOS_PAGO = ['efectivo', 'nequi', 'daviplata', 'bancolombia', 'otro'] as const
export type MedioPago = (typeof MEDIOS_PAGO)[number]

// formatos de imagen que acepta upload.ts para las referencias; el mismo string se guarda en el pedido
export const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp'] as const
export type TipoImagen = (typeof TIPOS_IMAGEN)[number]

// lo que va firmado dentro del token - sub es el id de Usuario, se llama asi por convencion JWT
export interface JwtPayload {
  sub: string
  email: string
  rol: Rol
}
