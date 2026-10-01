import type { Pedido, PedidoAdmin, EstadoPedido, Familia, HistorialEstadoPedido, MetodoEntrega } from '../types'

// fabrica de pedidos de prueba: solo lo que cada test cambia, el resto con valores neutros
export function pedido(parcial: {
  _id?: string
  nombre?: string
  familia?: Familia
  estado?: EstadoPedido
  fechaEntrega?: string | null
  fechaDeseada?: string | null
  fechaSolicitud?: string
  esDimensionPersonalizada?: boolean
  entrega?: { metodo: MetodoEntrega; detalle: string }
  contacto?: { nombre: string; telefono: string }
  pago?: Pedido['pago']
  contactadoEn?: string | null
  historialEstados?: HistorialEstadoPedido[]
}): Pedido {
  const estado = parcial.estado ?? 'recibido'
  return {
    _id: parcial._id ?? '64f1a2b3c4d5e6f7a8b93f9a2c',
    cliente: 'cliente-1',
    producto: { _id: 'p1', nombre: parcial.nombre ?? 'Topper luna' },
    categoria: { _id: 'c1', nombre: 'Toppers de acrílico', familia: parcial.familia ?? 'toppers' },
    descripcion: 'Descripcion del pedido',
    dimensiones: { valor: 22, unidad: 'cm', esDimensionPersonalizada: parcial.esDimensionPersonalizada ?? false },
    cantidad: 1,
    colores: 'dorado',
    materiales: 'acrílico',
    imagenesReferencia: [],
    estado,
    contacto: parcial.contacto ?? { nombre: 'Laura', telefono: '3192452842' },
    entrega: parcial.entrega ?? { metodo: 'recoger', detalle: '' },
    fechaSolicitud: parcial.fechaSolicitud ?? '2026-09-20T12:00:00.000Z',
    fechaDeseada: parcial.fechaDeseada === undefined ? '2026-12-12T22:00:00.000Z' : parcial.fechaDeseada,
    fechaEntrega: parcial.fechaEntrega ?? null,
    pago: parcial.pago ?? null,
    contactadoEn: parcial.contactadoEn ?? null,
    confirmacionDimensionPersonalizada: false,
    historialEstados: parcial.historialEstados ?? [
      { estadoAnterior: null, estadoNuevo: estado, fecha: '2026-09-20T12:00:00.000Z' },
    ],
  }
}

// en el panel el pedido siempre trae al cliente populado con su correo
export function pedidoAdmin(parcial: Parameters<typeof pedido>[0] = {}): PedidoAdmin {
  return { ...pedido(parcial), cliente: { _id: 'c1', email: 'laura@taju.co' } }
}

/** Forma que guardaba el servidor anterior a la solicitud: sin contacto, entrega, fechaDeseada, pago ni contactadoEn. */
export function antiguo<T extends object>(p: T): T {
  const copia: Record<string, unknown> = { ...(p as Record<string, unknown>) }
  for (const k of ['contacto', 'entrega', 'fechaDeseada', 'pago', 'contactadoEn']) delete copia[k]
  return copia as T
}
