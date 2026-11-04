import { useEffect, useState } from 'react'
import { Button } from '../ui/Button'

// [DECISION] 4 s - una solicitud con fotos suele tardar 2 a 3 s; pasado eso el cliente empieza a dudar y conviene decirle que sigue en curso
const MS_ENVIO_LENTO = 4_000

/** Aviso del envio; vive solo mientras se envia, asi el temporizador arranca de cero en cada intento. */
function AvisoEnvio() {
  const [lento, setLento] = useState(false)
  useEffect(() => {
    const id = setTimeout(() => setLento(true), MS_ENVIO_LENTO)
    return () => clearTimeout(id)
  }, [])
  return (
    <p className="mb-2 text-center text-sm text-texto-secundario">
      {lento
        ? 'Seguimos enviando tu solicitud. Con fotos puede tardar unos segundos más, no cierres esta página.'
        : 'Estamos enviando tu solicitud. No cierres esta página.'}
    </p>
  )
}

/**
 * Barra de acciones del formulario: fija abajo en el movil, en linea al pie del momento en escritorio.
 * Una sola accion primaria: Siguiente en los momentos 1 a 3 y Enviar mi pedido en el repaso.
 * @prop paso - Momento actual (1 a total).
 * @prop onAtras - Vuelve al momento anterior.
 * @prop enviando - Deshabilita la accion primaria y muestra por que.
 * @prop procesando - Una imagen de referencia se esta preparando: la accion primaria espera y dice por que.
 */
interface BarraAccionesProps {
  paso: number
  total?: number
  onAtras: () => void
  enviando: boolean
  procesando?: boolean
}

export function BarraAcciones({ paso, total = 4, onAtras, enviando, procesando = false }: BarraAccionesProps) {
  const esRepaso = paso === total
  // valor arbitrario a proposito: en el iPhone el indicador de inicio tapa el borde inferior; la escala no tiene env()
  return (
    <div className="fixed inset-x-0 bottom-0 z-encabezado border-t border-borde-sutil bg-superficie-base p-4 pb-[calc(var(--space-4)+env(safe-area-inset-bottom))] lg:static lg:border-0 lg:bg-transparent lg:p-0">
      {/* la region vive siempre en el DOM: una region viva que aparece con el texto ya puesto no se anuncia en varios lectores */}
      <div role="status">{enviando && <AvisoEnvio />}</div>
      {/* sin role: la zona de referencias ya anuncia "Preparando tu imagen…" */}
      {procesando && !enviando && (
        <p className="mb-2 text-center text-xs text-texto-secundario">Estamos preparando tu imagen…</p>
      )}
      <div className="mx-auto flex max-w-contenedor items-center justify-between gap-3">
        {paso > 1 ? (
          <Button type="button" variante="fantasma" onClick={onAtras} disabled={enviando}>
            Atrás
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" variante="primario" cargando={enviando} disabled={procesando} className="min-w-0 flex-1 sm:flex-none">
          {esRepaso ? (enviando ? 'Enviando tu pedido…' : 'Enviar mi pedido') : 'Siguiente'}
        </Button>
      </div>
    </div>
  )
}
