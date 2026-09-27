import { Button } from '../ui/Button'
import { BotonWhatsApp } from '../shared/BotonWhatsApp'

/**
 * Estado sin resultados: explica, ofrece la salida y el canal a la medida (voz de marca §6.4).
 * @prop alLimpiar - Quita familia, búsqueda y ocasión.
 */
export function EstadoVacioCatalogo({ alLimpiar }: { alLimpiar: () => void }) {
  return (
    <div className="flex flex-col items-start gap-6 py-12">
      <p className="text-lg text-texto-principal max-w-prosa">
        No encontramos productos con ese filtro. Prueba quitando alguno o escríbenos y lo cotizamos
        a la medida.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button variante="secundario" onClick={alLimpiar}>
          Quitar los filtros
        </Button>
        <BotonWhatsApp mensaje="Hola, busco algo que no encontré en el catálogo.">
          Escríbenos por WhatsApp
        </BotonWhatsApp>
      </div>
    </div>
  )
}
