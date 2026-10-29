import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'
import { enlaceWhatsApp } from '../../lib/whatsapp'
import type { RazonRechazo, RechazoImagen } from '../../lib/inspeccionarImagen'

export type { RechazoImagen }

// que paso, por que importa y que hacer; nunca culpa a quien eligio la foto. El peso no lleva cifra fija: sirve igual para
// "mas de 25 MB" que para "sigue pesando mucho aun reducida"
const TEXTOS: Record<RazonRechazo, (nombre: string) => string> = {
  heic: (n) =>
    `${n} está en formato HEIC, el que usa tu iPhone por defecto, y aún no lo leemos. Cámbialo en Ajustes > Cámara > Formatos > Más compatible, o elige la foto desde Fotos y no desde Archivos.`,
  formato: (n) => `${n} no es JPG, PNG ni WebP, que son los formatos que podemos leer. Elige otra imagen o envíanosla por WhatsApp.`,
  peso: (n) => `${n} pesa demasiado, incluso si la reducimos. Elige una versión más liviana o envíanosla por WhatsApp.`,
  pixeles: (n) =>
    `${n} es una imagen enorme y tu celular podría quedarse sin memoria al prepararla. Elige otra o envíanosla por WhatsApp.`,
  ilegible: (n) => `${n}: no pudimos leerla. Prueba con otra o envíanosla por WhatsApp.`,
  exceso: (n) => `Caben hasta 3 fotos. ${n} quedó fuera: quita alguna si quieres cambiarla.`,
}

const MENSAJE_WHATSAPP = 'Hola TaJú, no pude subir mis fotos de referencia al pedido.'

/**
 * Aviso de las imágenes que no se pudieron agregar. Un solo diálogo para toda la selección: cada archivo con su motivo.
 * @prop rechazos - Archivos rechazados; con la lista vacía no se pinta.
 * @prop onCerrar - Cierra el aviso (botón, Escape o fondo).
 */
export function AvisoImagenDialog({ rechazos, onCerrar }: { rechazos: RechazoImagen[]; onCerrar: () => void }) {
  const titulo = rechazos.length === 1 ? 'No pudimos agregar tu foto' : 'No pudimos agregar todas tus fotos'

  return (
    <Dialog abierto={rechazos.length > 0} titulo={titulo} onCerrar={onCerrar}>
      <ul className="flex flex-col gap-3">
        {rechazos.map((rechazo, i) => (
          <li key={`${rechazo.nombre}-${i}`} className="text-sm text-texto-secundario">
            {TEXTOS[rechazo.razon](rechazo.nombre)}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <a
          href={enlaceWhatsApp(MENSAJE_WHATSAPP)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-boton items-center rounded-campo text-sm font-medium text-texto-principal underline underline-offset-4 focus-visible:outline-none focus-visible:shadow-foco"
        >
          {rechazos.length === 1 ? 'Enviarla por WhatsApp' : 'Enviarlas por WhatsApp'}
        </a>
        <Button onClick={onCerrar}>Volver a mis fotos</Button>
      </div>
    </Dialog>
  )
}
