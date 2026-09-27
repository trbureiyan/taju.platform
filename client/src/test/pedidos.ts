import type { Pedido, EstadoPedido, Familia, HistorialEstadoPedido } from '../types'

// fabrica de pedidos de prueba: solo lo que cada test cambia, el resto con valores neutros
export function pedido(parcial: {
  _id?: string
  nombre?: string
  familia?: Familia
  estado?: EstadoPedido
  fechaEntrega?: string | null
  fechaSolicitud?: string
  esDimensionPersonalizada?: boolean
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
    fechaSolicitud: parcial.fechaSolicitud ?? '2026-09-20T12:00:00.000Z',
    fechaEntrega: parcial.fechaEntrega ?? null,
    confirmacionDimensionPersonalizada: false,
    historialEstados: parcial.historialEstados ?? [
      { estadoAnterior: null, estadoNuevo: estado, fecha: '2026-09-20T12:00:00.000Z' },
    ],
  }
}
