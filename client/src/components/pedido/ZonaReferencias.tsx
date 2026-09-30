import { useEffect, useId, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import {
  comprimirImagen,
  ErrorImagen,
  MENSAJE_FORMATO_IMAGEN,
  MENSAJE_IMAGEN_ILEGIBLE,
  TIPOS_IMAGEN_ACEPTADOS,
} from '../../lib/comprimirImagen'

/**
 * Zona para adjuntar las imagenes de referencia. En el celular es un toque que abre galeria o camara; el arrastre
 * es un extra de escritorio. Cada imagen se reduce en el navegador antes de guardarse (ver comprimirImagen).
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
  const [mensaje, setMensaje] = useState<string | null>(null)

  const lleno = archivos.length >= max
  const errorId = error ? `${id}-error` : undefined
  const mensajeId = mensaje ? `${id}-mensaje` : undefined

  async function agregar(nuevos: File[]) {
    const avisos: string[] = []
    const validos = nuevos.filter((f) => TIPOS_IMAGEN_ACEPTADOS.includes(f.type))
    if (validos.length < nuevos.length) avisos.push(MENSAJE_FORMATO_IMAGEN)
    const lugar = max - archivos.length
    const aceptados = validos.slice(0, lugar)
    if (validos.length > lugar) avisos.push(`Caben hasta ${max} imágenes. Quita alguna si quieres cambiarla.`)

    const listos: File[] = []
    if (aceptados.length > 0) {
      setProcesando(true)
      // aviso directo y no por efecto: si el momento se desmonta a mitad, el false igual llega al formulario
      onProcesando?.(true)
      // en orden y una por una: si una falla, las que ya salieron bien se conservan
      for (const archivo of aceptados) {
        try {
          listos.push(await comprimirImagen(archivo))
        } catch (err) {
          avisos.push(err instanceof ErrorImagen ? err.message : MENSAJE_IMAGEN_ILEGIBLE)
        }
      }
      // mientras se procesa no se puede agregar ni quitar, y el formulario no avanza: archivos sigue vigente
      if (listos.length > 0) onCambio([...archivos, ...listos])
      setProcesando(false)
      onProcesando?.(false)
    }
    setMensaje(avisos.length > 0 ? avisos.join(' ') : null)
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
    setMensaje(null)
    onCambio(archivos.filter((_, i) => i !== indice))
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-texto-principal">
          Imágenes de referencia
          <span className="ml-1 font-normal text-texto-tenue">
            {obligatoria ? '(obligatoria, hasta 3)' : '(opcional, hasta 3)'}
          </span>
        </span>
        <span className="text-xs text-texto-secundario">Una foto nos ahorra idas y vueltas para entender lo que imaginas.</span>
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
        <input
          type="file"
          accept={TIPOS_IMAGEN_ACEPTADOS.join(',')}
          multiple
          disabled={lleno || procesando}
          onChange={alElegir}
          aria-label="Elige imágenes de referencia"
          aria-invalid={error ? true : undefined}
          aria-describedby={[errorId, mensajeId].filter(Boolean).join(' ') || undefined}
          className="sr-only"
        />
        {procesando ? (
          <Loader2 aria-hidden="true" size={24} className="animate-spin text-texto-secundario" />
        ) : (
          <ImagePlus aria-hidden="true" size={24} className="text-texto-secundario" />
        )}
        <span className="text-base font-medium text-texto-principal">
          {procesando ? (
            <span role="status">Preparando tu imagen…</span>
          ) : lleno ? (
            `Ya tienes ${max} imágenes`
          ) : (
            'Toca para elegir o arrastra aquí'
          )}
        </span>
        <span className="text-xs text-texto-secundario">
          {lleno ? 'Quita una si quieres cambiarla.' : 'JPG, PNG o WebP. Las reducimos para que suban rápido.'}
        </span>
      </label>

      {error && (
        <p id={errorId} className="text-xs text-error-texto">
          {error}
        </p>
      )}
      {mensaje && (
        <p id={mensajeId} role="alert" className="text-xs text-error-texto">
          {mensaje}
        </p>
      )}

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
