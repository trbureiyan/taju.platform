import { Schema, model, Types } from 'mongoose'

// reserva de corta vida contra el doble envio de un mismo pedido (issue #17) - ver crearPedido en pedidos.service.ts.
// el _id ES la clave: el indice unico que Mongo ya trae sobre _id es lo que serializa los requests concurrentes
export interface IIdempotenciaPedido {
  _id: string
  pedido: Types.ObjectId
  expiraEn: Date
}

const idempotenciaPedidoSchema = new Schema<IIdempotenciaPedido>(
  {
    _id: { type: String, required: true },
    pedido: { type: Schema.Types.ObjectId, ref: 'Pedido', required: true },
    // TTL con expires 0: Mongo borra el documento al llegar a expiraEn. El monitor corre cada ~60s,
    // asi que el service no confia en el y trata como libre cualquier reserva ya vencida
    expiraEn: { type: Date, required: true, expires: 0 },
  },
  { versionKey: false },
)

export const IdempotenciaPedido = model<IIdempotenciaPedido>(
  'IdempotenciaPedido',
  idempotenciaPedidoSchema,
  'idempotencia_pedidos',
)
