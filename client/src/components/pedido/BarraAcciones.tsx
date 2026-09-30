import { Button } from '../ui/Button'

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
  return (
    <div className="fixed inset-x-0 bottom-0 z-encabezado border-t border-borde-sutil bg-superficie-base p-4 lg:static lg:border-0 lg:bg-transparent lg:p-0">
      {enviando && (
        <p role="status" className="mb-2 text-center text-xs text-texto-secundario">
          Estamos enviando tu solicitud. No cierres esta página.
        </p>
      )}
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
        <Button type="submit" variante="primario" disabled={enviando || procesando} className="min-w-0 flex-1 sm:flex-none">
          {esRepaso ? (enviando ? 'Enviando tu pedido…' : 'Enviar mi pedido') : 'Siguiente'}
        </Button>
      </div>
    </div>
  )
}
