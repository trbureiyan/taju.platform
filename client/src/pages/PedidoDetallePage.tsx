import { useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import type { Pedido } from '../types'
import { usePedido } from '../hooks/usePedido'
import { pedidoEnMemoria } from '../hooks/useMisPedidos'
import { EsperaTaller } from '../components/shared/EsperaTaller'
import { Button } from '../components/ui/Button'
import { LineaTiempoPedido } from '../components/orders/LineaTiempoPedido'
import { BloqueEntrega } from '../components/orders/BloqueEntrega'
import { AccionesPedido } from '../components/orders/AccionesPedido'
import { FranjaEspecificaciones, type ParEspecificacion } from '../components/producto/FranjaEspecificaciones'
import { ETIQUETAS_ESTADO, ETIQUETAS_FAMILIA } from '../types'
import { codigoPedido } from '../lib/pedido'
import { contenidoDe } from '../components/vitrina/contenido'

function paresDePedido(pedido: Pedido): ParEspecificacion[] {
  return [
    {
      etiqueta: 'Medida',
      valor: pedido.dimensiones.esDimensionPersonalizada
        ? `${pedido.dimensiones.valor} ${pedido.dimensiones.unidad} (medida personalizada)`
        : `${pedido.dimensiones.valor} ${pedido.dimensiones.unidad}`,
    },
    { etiqueta: 'Cantidad', valor: pedido.cantidad },
    { etiqueta: 'Celular', valor: pedido.contacto.telefono },
    { etiqueta: 'Colores', valor: pedido.colores },
    { etiqueta: 'Materiales', valor: pedido.materiales },
    { etiqueta: 'Descripción', valor: pedido.descripcion },
    ...(pedido.imagenesReferencia.length > 0
      ? [
          {
            etiqueta: 'Imágenes de referencia',
            valor: (
              <ul className="flex gap-2 flex-wrap">
                {pedido.imagenesReferencia.map((img, i) => (
                  <li key={i}>
                    <a href={img.url} target="_blank" rel="noopener noreferrer">
                      <img src={img.url} alt={img.nombreOriginal} className="w-16 h-16 rounded-md object-cover" />
                    </a>
                  </li>
                ))}
              </ul>
            ),
          },
        ]
      : []),
  ]
}

export function PedidoDetallePage() {
  const { id = '' } = useParams<{ id: string }>()
  return <DetallePedido key={id} id={id} inicial={pedidoEnMemoria(id)} />
}

function DetallePedido({ id, inicial }: { id: string; inicial?: Pedido }) {
  const { pedido, estado, reintentar, reemplazar } = usePedido(id, inicial)
  const titulo = useRef<HTMLHeadingElement>(null)
  const envoltura = 'w-full max-w-contenedor mx-auto px-4 py-12'

  if (estado === 'cargando') {
    return (
      <div className={envoltura}>
        <EsperaTaller mensaje="Estamos trayendo tu pedido" />
      </div>
    )
  }

  if (estado === 'no-encontrado') {
    return (
      <div className={[envoltura, 'flex flex-col items-start gap-4'].join(' ')}>
        <p className="text-lg text-texto-principal">No encontramos este pedido.</p>
        <Link to="/mis-pedidos" className="inline-flex items-center min-h-boton font-medium underline underline-offset-4">
          Volver a Mis pedidos
        </Link>
      </div>
    )
  }

  if (estado === 'error' || !pedido) {
    return (
      <div className={envoltura}>
        <div role="alert" className="flex flex-col items-start gap-4 rounded-tarjeta border border-error-borde bg-error-fondo p-6">
          <p className="font-medium text-error-texto">No pudimos traer este pedido</p>
          <p className="text-sm text-error-texto">Tuvimos un problema de conexión. Prueba de nuevo en unos segundos.</p>
          <Button variante="secundario" onClick={reintentar}>
            Probar de nuevo
          </Button>
        </div>
      </div>
    )
  }

  // el boton de cancelar desaparece con el pedido cancelado: el foco pasa al titulo para no perderse en el body
  function alCancelar(actualizado: Pedido) {
    reemplazar(actualizado)
    setTimeout(() => titulo.current?.focus(), 0)
  }

  const codigo = codigoPedido(pedido._id)
  const contenido = contenidoDe(pedido.categoria.familia)

  return (
    <article className={[envoltura, 'flex flex-col gap-8 pb-24 lg:pb-12'].join(' ')}>
      <header className={[contenido.claseFondo, 'rounded-tarjeta p-6 flex flex-col gap-2'].join(' ')}>
        <p className="text-xs font-medium uppercase tracking-wide text-texto-secundario">
          {ETIQUETAS_FAMILIA[pedido.categoria.familia]}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 ref={titulo} tabIndex={-1} className="text-h1 text-texto-principal focus:outline-none">{pedido.producto.nombre}</h1>
          <span className="font-mono text-sm text-texto-secundario">{codigo}</span>
          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-superficie-base text-texto-principal">
            {ETIQUETAS_ESTADO[pedido.estado]}
          </span>
        </div>
      </header>

      <LineaTiempoPedido estadoActual={pedido.estado} historialEstados={pedido.historialEstados} />

      <BloqueEntrega
        fechaDeseada={pedido.fechaDeseada}
        fechaEntrega={pedido.fechaEntrega}
        entrega={pedido.entrega}
      />

      <div>
        <h2 className="text-sm font-medium text-texto-secundario uppercase tracking-wide mb-2">Lo que pediste</h2>
        <FranjaEspecificaciones pares={paresDePedido(pedido)} />
      </div>

      <AccionesPedido
        productoId={pedido.producto._id}
        pedidoId={pedido._id}
        nombreProducto={pedido.producto.nombre}
        codigo={codigo}
        estado={pedido.estado}
        onCancelado={alCancelar}
      />
    </article>
  )
}
