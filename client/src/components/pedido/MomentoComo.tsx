import { Textarea } from '../ui/Textarea'
import { BotonWhatsApp } from '../shared/BotonWhatsApp'
import { AvisoErrores } from './AvisoErrores'
import { ZonaReferencias } from './ZonaReferencias'
import { exigeReferencia } from '../../lib/requisitos'
import { CLASE_TITULO, type PropsMomento } from './tipos'

const MAX_DESCRIPCION = 500

export function MomentoComo({
  producto,
  campos,
  errores,
  set,
  tituloRef,
  archivos,
  cambiarArchivos,
  desdeOtroPedido = false,
}: PropsMomento & {
  archivos: File[]
  cambiarArchivos: (archivos: File[]) => void
  // "Pedir de nuevo": las imagenes del pedido original no se copian, hay que avisarlo
  desdeOtroPedido?: boolean
}) {
  return (
    <div className="flex flex-col gap-6">
      <h2 ref={tituloRef} tabIndex={-1} className={CLASE_TITULO}>
        Cómo lo imaginas
      </h2>
      <AvisoErrores errores={errores} />
      {desdeOtroPedido && (
        <p className="text-xs text-texto-secundario">
          Si quieres usar las mismas imágenes de referencia, adjúntalas de nuevo.
        </p>
      )}

      <ZonaReferencias
        archivos={archivos}
        onCambio={cambiarArchivos}
        obligatoria={exigeReferencia(producto.categoria.familia)}
        error={errores.archivos}
      />

      <Textarea
        label="Descripción del pedido"
        maxLength={MAX_DESCRIPCION}
        rows={4}
        placeholder="Cuéntanos qué necesitas y para qué ocasión"
        ayuda="Hasta 500 caracteres. Deja lo esencial (estilo, mensaje, detalles) y el resto lo hablamos por WhatsApp."
        value={campos.descripcion}
        onChange={(e) => set('descripcion', e.target.value)}
        error={errores.descripcion}
        anunciarError={false}
      />

      <BotonWhatsApp variante="linea" mensaje={`Hola, tengo una duda sobre mi referencia para: ${producto.nombre}.`}>
        ¿Dudas? Escríbenos
      </BotonWhatsApp>
    </div>
  )
}
