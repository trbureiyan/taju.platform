import { useEffect, useId, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { comprimirImagen, ErrorImagen, TIPOS_IMAGEN_ACEPTADOS } from '../../lib/comprimirImagen'
import { AvisoImagenDialog, type RechazoImagen } from './AvisoImagenDialog'

/**
 * Zona para adjuntar la foto de referencia. En el celular es un toque que abre galeria o camara; el arrastre
 * es un extra de escritorio. Cada imagen se reduce en el navegador antes de guardarse (ver comprimirImagen), y lo que no
 * se puede agregar se avisa en un dialogo (AvisoImagenDialog), no en una linea suelta.
 * @prop archivos - Imagenes ya elegidas (componente controlado).
 * @prop onCambio - Recibe la lista nueva al agregar o quitar.
 * @prop obligatoria - Si la familia del producto exige referencia (topper).
 * @prop error - Mensaje de validacion del momento; se enlaza al campo.
 * @prop max - Cantidad maxima de imagenes (3, como el servidor).
 * @prop onProcesando - Avisa cuando empieza y termina de preparar imagenes, para que el formulario espere.
 */
interface ZonaReferenciasProps {
  archivos: File[]
  onCambio: (archivos: File[]) => void
  obligatoria: boolean
  error?: string
  max?: number
  onProcesando?: (procesando: boolean) => void
}

function peso(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

// cada vista previa es duena de su URL de objeto: se crea y se revoca en el mismo efecto, asi que el
// desmontaje simulado de StrictMode no deja una URL revocada en pantalla. Se asigna por ref (sin setState en el efecto)
function VistaPrevia({ archivo }: { archivo: File }) {
  const ref = useRef<HTMLImageElement>(null)
  useEffect(() => {
    const url = URL.createObjectURL(archivo)
    if (ref.current) ref.current.src = url
    return () => URL.revokeObjectURL(url)
  }, [archivo])
  return <img ref={ref} alt="" className="h-12 w-12 shrink-0 rounded-campo object-cover" />
}

export function ZonaReferencias({ archivos, onCambio, obligatoria, error, max = 3, onProcesando }: ZonaReferenciasProps) {
  const id = useId()
  const [arrastrando, setArrastrando] = useState(false)
  const [procesando, setProcesando] = useState(false)
  const [rechazos, setRechazos] = useState<RechazoImagen[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const huboAviso = useRef(false)

  const lleno = archivos.length >= max
  const errorId = error ? `${id}-error` : undefined

  // al cerrar el aviso el foco vuelve al campo (Dialog devuelve el foco a quien lo tenia al abrir, que tras elegir archivos
  // suele ser el body). Este efecto corre despues de esa limpieza porque el padre va despues del hijo
  useEffect(() => {
    if (rechazos.length > 0) huboAviso.current = true
    else if (huboAviso.current) {
      huboAviso.current = false
      inputRef.current?.focus()
    }
  }, [rechazos.length])

  async function agregar(nuevos: File[]) {
    if (nuevos.length === 0) return
    const avisos: RechazoImagen[] = []
    const lugar = max - archivos.length
    const listos: File[] = []

    setProcesando(true)
    // aviso directo y no por efecto: si el momento se desmonta a mitad, el false igual llega al formulario
    onProcesando?.(true)
    // en orden y una por una: si una falla, las que ya salieron bien se conservan. Un rechazado no ocupa lugar:
    // solo los que se aceptan cuentan contra el cupo, asi un PDF al inicio no deja fuera una foto que si cabia
    for (const archivo of nuevos) {
      if (listos.length >= lugar) {
        avisos.push({ nombre: archivo.name, razon: 'exceso' })
        continue
      }
      try {
        listos.push(await comprimirImagen(archivo))
      } catch (err) {
        avisos.push({ nombre: archivo.name, razon: err instanceof ErrorImagen ? err.razon : 'ilegible' })
      }
    }
    // mientras se procesa no se puede agregar ni quitar, y el formulario no avanza: archivos sigue vigente
    if (listos.length > 0) onCambio([...archivos, ...listos])
    setProcesando(false)
    onProcesando?.(false)
    setRechazos(avisos)
  }

  function alElegir(e: ChangeEvent<HTMLInputElement>) {
    const elegidos = Array.from(e.target.files ?? [])
    e.target.value = '' // permite volver a elegir el mismo archivo despues de quitarlo
    void agregar(elegidos)
  }

  function alSoltar(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault()
    setArrastrando(false)
    if (lleno || procesando) return
    void agregar(Array.from(e.dataTransfer.files))
  }

  function quitar(indice: number) {
    onCambio(archivos.filter((_, i) => i !== indice))
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-texto-principal">
          Foto de referencia
          <span className="ml-1 font-normal text-texto-tenue">{obligatoria ? '(obligatoria)' : '(opcional)'}</span>
        </span>
        <span className="text-xs text-texto-secundario">
          Con una foto nos alcanza para entender lo que imaginas. Si quieres, puedes agregar hasta {max}.
        </span>
      </div>

      <label
        onDragOver={(e) => {
          e.preventDefault()
          if (!lleno) setArrastrando(true)
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={alSoltar}
        className={[
          'relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center',
          'transition-[border-color,background-color] duration-normal ease-estandar',
          'has-[:focus-visible]:shadow-foco',
          lleno ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
          arrastrando ? 'border-accion bg-superficie-calida' : error ? 'border-error-borde bg-campo-fondo' : 'border-borde-medio bg-campo-fondo hover:border-borde-fuerte',
        ].join(' ')}
      >
        {/* [DECISION] accept sin HEIC: con esta lista iOS entrega JPEG al elegir de la galeria (lo reportan varias fuentes; sin
            datos de iOS 18, probar en un iPhone). Los HEIC que se cuelan por Archivos los explica AvisoImagenDialog */}
        <input
          ref={inputRef}
          type="file"
          accept={TIPOS_IMAGEN_ACEPTADOS.join(',')}
          multiple
          disabled={lleno || procesando}
          onChange={alElegir}
          aria-label="Elige una foto de referencia"
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className="sr-only"
        />
        {procesando ? (
          <Loader2 aria-hidden="true" size={24} className="animate-spin text-texto-secundario" />
        ) : (
          <ImagePlus aria-hidden="true" size={24} className="text-texto-secundario" />
        )}
        <span className="text-base font-medium text-texto-principal">
          {procesando ? (
            <span role="status">Preparando tu foto…</span>
          ) : lleno ? (
            `Ya tienes ${max} fotos`
          ) : archivos.length > 0 ? (
            'Agregar otra foto'
          ) : (
            'Elige una foto'
          )}
        </span>
        <span className="text-xs text-texto-secundario">
          {lleno ? 'Quita una si quieres cambiarla.' : 'JPG, PNG o WebP. La preparamos para que se envíe rápido.'}
        </span>
      </label>

      {error && (
        <p id={errorId} className="text-xs text-error-texto">
          {error}
        </p>
      )}

      <AvisoImagenDialog rechazos={rechazos} onCerrar={() => setRechazos([])} />

      {archivos.length > 0 && (
        <ul className="flex flex-col gap-2">
          {archivos.map((archivo, i) => (
            <li key={`${archivo.name}-${i}`} className="flex items-center gap-3 rounded-tarjeta border border-borde-sutil bg-superficie-hundida p-2">
              <VistaPrevia archivo={archivo} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm text-texto-principal">{archivo.name}</span>
                <span className="text-xs text-texto-secundario tabular-nums">{peso(archivo.size)}</span>
              </span>
              <button
                type="button"
                onClick={() => quitar(i)}
                // quitar mientras se procesa lo pisaria la lista vieja al terminar
                disabled={procesando}
                aria-label={`Quitar ${archivo.name}`}
                className="flex h-boton w-boton shrink-0 items-center disabled:opacity-50 disabled:cursor-not-allowed justify-center rounded-boton text-texto-secundario transition-transform duration-normal ease-estandar hover:bg-superficie-elevada active:scale-97 focus-visible:outline-none focus-visible:shadow-foco"
              >
                <X aria-hidden="true" size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
