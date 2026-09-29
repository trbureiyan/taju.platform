import { Link } from 'react-router-dom'
import type { Pedido } from '../../types'
import { ETIQUETAS_ESTADO, CLASES_ESTADO, ETIQUETAS_FAMILIA } from '../../types'
import { codigoPedido, SIGUIENTE_PASO, enCurso, fechaConHora } from '../../lib/pedido'
import { contenidoDe } from '../vitrina/contenido'
import { PiezaSilueta } from '../vitrina/PiezaSilueta'
import { LineaAvance } from './LineaAvance'

/**
 * Tarjeta de un pedido en la lista: un solo enlace a su detalle, franja de familia y lo próximo que
 * el cliente necesita saber (fecha de entrega si existe, si no el mensaje del estado actual).
 * @prop pedido - Pedido a mostrar.
 */
export function TarjetaPedido({ pedido }: { pedido: Pedido }) {
  const entregado = !enCurso(pedido.estado)
  const contenido = contenidoDe(pedido.categoria.familia)

  const proximo = pedido.fechaEntrega
    ? `Te lo entregamos el ${fechaConHora(pedido.fechaEntrega)}`
    : SIGUIENTE_PASO[pedido.estado]

  return (
    <Link
      to={`/mis-pedidos/${pedido._id}`}
      className={[
        'flex gap-4 rounded-tarjeta border border-borde-sutil bg-superficie-base p-4',
        'transition-[transform,box-shadow] duration-normal ease-estandar hover:shadow-tarjeta active:scale-97',
        'focus-visible:outline-none focus-visible:shadow-foco',
        entregado ? 'opacity-75' : '',
      ].join(' ')}
    >
      <div
        className={[
          'shrink-0 w-16 rounded-tarjeta flex items-center justify-center',
          entregado ? 'bg-superficie-hundida text-texto-tenue' : `${contenido.claseFondo} text-texto-principal`,
        ].join(' ')}
      >
        <PiezaSilueta silueta={contenido.silueta} className="w-10 h-10" />
      </div>

      <div className="flex-1 flex flex-col gap-2 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium text-texto-principal truncate">{pedido.producto.nombre}</p>
            <p className="text-xs text-texto-tenue">
              {ETIQUETAS_FAMILIA[pedido.categoria.familia]} · <span className="font-mono">{codigoPedido(pedido._id)}</span>
            </p>
          </div>
          <span
            className={`shrink-0 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${CLASES_ESTADO[pedido.estado]}`}
          >
            {ETIQUETAS_ESTADO[pedido.estado]}
          </span>
        </div>

        <LineaAvance estado={pedido.estado} atenuada={entregado} />

        <p className="text-sm text-texto-secundario">{proximo}</p>
      </div>
    </Link>
  )
}
