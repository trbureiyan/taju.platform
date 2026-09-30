import { HojaResumen } from './HojaResumen'
import { calcularPrecioTotal } from '../../lib/precio'
import { exigeReferencia } from '../../lib/requisitos'
import { resumenDesdeCampos } from '../../lib/resumenPedido'
import { CLASE_TITULO, type PropsMomento } from './tipos'

export function MomentoRepaso({
  producto,
  campos,
  tituloRef,
  archivos,
  errorEnvio,
}: PropsMomento & { archivos: File[]; errorEnvio: string | null }) {
  const cantidad = parseInt(campos.cantidad, 10)
  const precio = !isNaN(cantidad) && cantidad > 0 ? calcularPrecioTotal(producto.precio, cantidad) : null
  const lineas = resumenDesdeCampos(campos, producto, {
    cantidad: archivos.length,
    obligatoria: exigeReferencia(producto.categoria.familia),
  })

  return (
    <div className="flex flex-col gap-6">
      <h2 ref={tituloRef} tabIndex={-1} className={CLASE_TITULO}>
        Repaso
      </h2>
      <p className="text-sm text-texto-secundario">Revisa que todo esté bien. Después de enviar te escribimos por WhatsApp.</p>

      <HojaResumen lineas={lineas} className="lg:static lg:max-h-none" />

      {precio && (
        <div className="rounded-tarjeta border border-borde-sutil bg-superficie-hundida p-4">
          <p className="text-sm text-texto-secundario">Precio estimado</p>
          <p className="text-lg font-semibold text-texto-principal tabular-nums">
            ${precio.total.toLocaleString('es-CO')}
          </p>
          <p className="text-xs text-texto-tenue">
            ${precio.unitario.toLocaleString('es-CO')} c/u × {campos.cantidad}. Es una referencia: el precio final lo
            confirmamos contigo.
          </p>
        </div>
      )}

      {errorEnvio && (
        <div role="alert" className="rounded-tarjeta border border-error-borde bg-error-fondo p-3">
          <p className="text-sm text-error-texto">{errorEnvio}</p>
        </div>
      )}

      <p className="text-xs text-texto-secundario">
        Enviar no te compromete a nada: primero confirmamos contigo el precio, la fecha y el anticipo.
      </p>
    </div>
  )
}
