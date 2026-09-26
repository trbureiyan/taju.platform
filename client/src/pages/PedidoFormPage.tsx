import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api } from '../lib/api'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { BotonWhatsApp } from '../components/shared/BotonWhatsApp'
import type { Producto, Pedido } from '../types'
import { ETIQUETAS_FAMILIA } from '../types'
import { calcularPrecioTotal } from '../lib/precio'

interface Campos {
  dimensionSeleccionada: string
  dimensionCustom: string
  descripcion: string
  cantidad: string
  colores: string
  materiales: string
  fechaEntrega: string
}

interface Errores {
  dimensionCustom?: string
  descripcion?: string
  cantidad?: string
  colores?: string
  materiales?: string
  fechaEntrega?: string
}

// un dia habil de margen minimo - da tiempo al taller a reaccionar antes de empezar a cortar
const DIAS_MINIMOS_ENTREGA = 1

function fechaMinimaEntrega(): string {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() + DIAS_MINIMOS_ENTREGA)
  // toISOString() convierte a UTC — en GMT-5 antes de las 19:00 la fecha UTC es un dia atras
  // getFullYear/Month/Date leen la zona local del dispositivo, que es donde opera el taller
  const y = fecha.getFullYear()
  const m = String(fecha.getMonth() + 1).padStart(2, '0')
  const d = String(fecha.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const MAX_ARCHIVOS = 3

// ─── Componente ───────────────────────────────────────────────────────────────

export function PedidoFormPage() {
  const { productoId } = useParams<{ productoId: string }>()
  const navigate = useNavigate()

  // producto sobre el que se pide + su carga inicial
  const [producto, setProducto] = useState<Producto | null>(null)
  const [cargando, setCargando] = useState(true)

  // imagenes de referencia, por fuera de "campos" porque File no es serializable como el resto del form
  const [archivos, setArchivos] = useState<File[]>([])
  const [archivoError, setArchivoError] = useState<string | null>(null)

  // resultado del envio - pedidoCreado no-null es lo que dispara la pantalla de "listo"
  const [pedidoCreado, setPedidoCreado] = useState<Pedido | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null)

  // campos del formulario, todo en string aunque el server espere numeros - se convierte recien al enviar
  const [campos, setCampos] = useState<Campos>({
    dimensionSeleccionada: '',
    dimensionCustom: '',
    descripcion: '',
    cantidad: '1',
    colores: '',
    materiales: '',
    fechaEntrega: '',
  })
  const [errores, setErrores] = useState<Errores>({})

  // sin categoria (sin radios) o eligiendo "personalizada" a mano - ambos casos piden el input libre
  const esDimensionPersonalizada =
    !campos.dimensionSeleccionada || campos.dimensionSeleccionada === 'personalizada'

  // ─── Carga del producto ───────────────────────────────────────────────────

  useEffect(() => {
    if (!productoId) return
    api
      .get<Producto>(`/productos/${productoId}`)
      .then((p) => setProducto(p))
      .catch(() => navigate('/catalogo', { replace: true })) // id invalido o producto de baja
      .finally(() => setCargando(false))
  }, [productoId, navigate])

  // ─── Handlers de campos ───────────────────────────────────────────────────

  // limpia el error del campo apenas el usuario vuelve a escribir en el, no espera al proximo submit
  function set(field: keyof Campos, value: string) {
    setCampos((prev) => ({ ...prev, [field]: value }))
    if (field in errores) setErrores((prev) => ({ ...prev, [field]: undefined }))
  }

  // valida aqui como espejo del middleware del server - asi el cliente ve el error al tiro, sin esperar el POST
  function handleArchivos(e: React.ChangeEvent<HTMLInputElement>) {
    setArchivoError(null)
    const files = Array.from(e.target.files ?? []).slice(0, MAX_ARCHIVOS)
    if (files.some((f) => f.type !== 'image/jpeg')) {
      setArchivoError('Solo se aceptan imágenes JPG')
      e.target.value = ''
      return
    }
    if (files.some((f) => f.size > 5 * 1024 * 1024)) {
      setArchivoError('Cada imagen debe pesar menos de 5 MB')
      e.target.value = ''
      return
    }
    setArchivos(files)
  }

  // ─── Validacion ───────────────────────────────────────────────────────────
  // espejo del crearPedidoSchema del server - mismas reglas duplicadas para dar feedback antes del POST

  function validar(): boolean {
    const next: Errores = {}
    if (esDimensionPersonalizada && !campos.dimensionCustom.trim()) {
      next.dimensionCustom = 'Ingresá el valor en cm'
    } else if (esDimensionPersonalizada && parseFloat(campos.dimensionCustom) <= 0) {
      next.dimensionCustom = 'El valor debe ser mayor a 0'
    }
    if (!campos.descripcion.trim()) next.descripcion = 'Describí tu pedido'
    const qty = parseInt(campos.cantidad, 10)
    if (!campos.cantidad || isNaN(qty) || qty < 1) next.cantidad = 'La cantidad mínima es 1'
    if (!campos.colores.trim()) next.colores = 'Indicá los colores'
    if (!campos.materiales.trim()) next.materiales = 'Indicá los materiales'
    // fechaEntrega es opcional, pero si la eligen tiene que respetar el minimo de produccion
    if (campos.fechaEntrega && campos.fechaEntrega < fechaMinimaEntrega()) {
      next.fechaEntrega = `Elegí una fecha a partir de ${fechaMinimaEntrega()}, que es lo mínimo que necesitamos para producir`
    }
    setErrores(next)
    return Object.keys(next).length === 0
  }

  // ─── Envio ────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!producto || !validar()) return

    setEnviando(true)
    setErrorEnvio(null)

    // si eligio una dimension base, mandamos su valor numerico; si no, el que escribio a mano
    const dimensiones = producto.categoria.dimensionesBase
    let dimensionValor: number
    if (esDimensionPersonalizada) {
      dimensionValor = parseFloat(campos.dimensionCustom)
    } else {
      const base = dimensiones.find((d) => d.etiqueta === campos.dimensionSeleccionada)
      dimensionValor = base?.valor ?? 0
    }

    const fd = new FormData()
    fd.append('productoId', producto._id)
    fd.append('categoriaId', producto.categoria._id)
    fd.append('descripcion', campos.descripcion)
    fd.append('dimensionValor', String(dimensionValor))
    fd.append('esDimensionPersonalizada', String(esDimensionPersonalizada))
    fd.append('cantidad', campos.cantidad)
    fd.append('colores', campos.colores)
    fd.append('materiales', campos.materiales)
    // mediodia local evita que la conversion a UTC cruce a la fecha anterior (ver AdminPedidosPage)
    if (campos.fechaEntrega) {
      fd.append('fechaEntrega', new Date(`${campos.fechaEntrega}T12:00:00`).toISOString())
    }
    archivos.forEach((f) => fd.append('imagenes', f))

    try {
      // FormData porque van archivos - api.post normal serializa a JSON y no sirve aqui
      const pedido = await api.postForm<Pedido>('/pedidos', fd)
      setPedidoCreado(pedido)
    } catch (err) {
      setErrorEnvio(err instanceof Error ? err.message : 'Error al enviar el pedido')
    } finally {
      setEnviando(false)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  if (cargando) return <p className="text-texto-secundario">Cargando…</p>
  if (!producto) return null // ya redirigio en el catch del effect

  // pantalla de exito reemplaza el formulario entero, no se muestran los dos a la vez
  if (pedidoCreado) {
    // mismo formato de fecha que MisPedidosPage/AdminPedidosPage - "a coordinar" si no se eligio fecha
    const fechaTexto = pedidoCreado.fechaEntrega
      ? new Date(pedidoCreado.fechaEntrega).toLocaleDateString('es-CO', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })
      : 'a coordinar'
    const mensajeWhatsApp = `Hola, quiero confirmar mi pedido #${pedidoCreado._id} de ${pedidoCreado.producto.nombre}. Fecha de entrega: ${fechaTexto}.`

    return (
      <div className="max-w-md mx-auto text-center py-12 flex flex-col gap-6">
        <div className="rounded-tarjeta bg-exito-fondo border border-exito-borde p-6">
          <p className="text-sm font-medium text-exito-texto mb-1">¡Pedido enviado con éxito!</p>
          <p className="text-xs text-exito-texto opacity-75">
            Número de seguimiento: {pedidoCreado._id}
          </p>
        </div>
        <p className="text-sm text-texto-secundario">
          Te avisaremos cuando tu pedido avance. Podés ver el estado en Mis pedidos.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variante="primario" onClick={() => navigate('/mis-pedidos')}>
            Ver mis pedidos
          </Button>
          <Button variante="secundario" onClick={() => navigate('/catalogo')}>
            Seguir viendo
          </Button>
        </div>
        {/* canal complementario - el pedido ya quedo registrado en la plataforma con trazabilidad, esto es para dudas puntuales */}
        <BotonWhatsApp variante="linea" mensaje={mensajeWhatsApp}>
          Confirmar por WhatsApp
        </BotonWhatsApp>
      </div>
    )
  }

  const dimensiones = producto.categoria.dimensionesBase
  const cantidadNumerica = parseInt(campos.cantidad, 10)
  const precioEstimado =
    !isNaN(cantidadNumerica) && cantidadNumerica > 0
      ? calcularPrecioTotal(producto.precio, cantidadNumerica)
      : null

  return (
    <section className="max-w-xl">
      <nav aria-label="Ruta de navegación" className="mb-6">
        <ol className="flex items-center gap-2 text-sm text-texto-tenue">
          <li><Link to="/catalogo" className="hover:text-texto-principal">Catálogo</Link></li>
          <li aria-hidden="true">/</li>
          <li>
            <Link to={`/catalogo/${producto._id}`} className="hover:text-texto-principal">
              {producto.nombre}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-texto-secundario">Solicitar pedido</li>
        </ol>
      </nav>

      <div className="mb-6 rounded-tarjeta border border-borde-sutil bg-superficie-hundida p-4">
        <p className="text-xs text-texto-tenue uppercase tracking-wide">
          {ETIQUETAS_FAMILIA[producto.categoria.familia]}
        </p>
        <p className="font-semibold text-texto-principal">{producto.nombre}</p>
        <p className="text-sm text-texto-secundario">{producto.categoria.nombre}</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        {/* radios de dimensionesBase + opcion "personalizada" - o el input libre solo si no hay dimensiones sugeridas */}
        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-medium text-texto-principal">Dimensión</legend>

          {dimensiones.length > 0 && (
            <div className="flex flex-col gap-2">
              {dimensiones.map((d) => (
                <label key={d.etiqueta} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="dimensionSeleccionada"
                    value={d.etiqueta}
                    checked={campos.dimensionSeleccionada === d.etiqueta}
                    onChange={(e) => set('dimensionSeleccionada', e.target.value)}
                    className="accent-accion"
                  />
                  <span className="text-sm text-texto-principal">
                    {d.etiqueta}: {d.valor} {d.unidad}
                  </span>
                </label>
              ))}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="dimensionSeleccionada"
                  value="personalizada"
                  checked={campos.dimensionSeleccionada === 'personalizada'}
                  onChange={(e) => set('dimensionSeleccionada', e.target.value)}
                  className="accent-accion"
                />
                <span className="text-sm text-texto-principal">Medida personalizada</span>
              </label>
            </div>
          )}

          {(esDimensionPersonalizada || dimensiones.length === 0) && (
            <Input
              label="Valor en cm"
              type="number"
              min="1"
              step="0.5"
              placeholder="Ej: 25"
              value={campos.dimensionCustom}
              onChange={(e) => set('dimensionCustom', e.target.value)}
              error={errores.dimensionCustom}
            />
          )}
        </fieldset>

        <Input
          label="Descripción del pedido"
          type="text"
          placeholder="Describí qué necesitás y para qué ocasión"
          value={campos.descripcion}
          onChange={(e) => set('descripcion', e.target.value)}
          error={errores.descripcion}
        />

        <Input
          label="Cantidad"
          type="number"
          min="1"
          step="1"
          value={campos.cantidad}
          onChange={(e) => set('cantidad', e.target.value)}
          error={errores.cantidad}
        />

        <Input
          label="Colores"
          type="text"
          placeholder="Ej: dorado y blanco"
          hint="Indicá los colores principales que querés"
          value={campos.colores}
          onChange={(e) => set('colores', e.target.value)}
          error={errores.colores}
        />

        <Input
          label="Materiales"
          type="text"
          placeholder="Ej: acrílico 3mm, madera terciada"
          hint="Si no sabés qué material, describí el uso y te asesoramos"
          value={campos.materiales}
          onChange={(e) => set('materiales', e.target.value)}
          error={errores.materiales}
        />

        <Input
          label="Fecha de entrega"
          type="date"
          min={fechaMinimaEntrega()}
          hint="Opcional - si no la sabés todavía, te la confirmamos por WhatsApp"
          value={campos.fechaEntrega}
          onChange={(e) => set('fechaEntrega', e.target.value)}
          error={errores.fechaEntrega}
        />

        {precioEstimado && (
          <div className="rounded-tarjeta border border-borde-sutil bg-superficie-hundida p-4">
            <p className="text-sm text-texto-secundario">Precio estimado</p>
            <p className="text-lg font-semibold text-texto-principal tabular-nums">
              ${precioEstimado.total.toLocaleString('es-CO')}
            </p>
            <p className="text-xs text-texto-tenue">
              ${precioEstimado.unitario.toLocaleString('es-CO')} c/u × {campos.cantidad}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-texto-principal">
            Imágenes de referencia
            <span className="ml-1 font-normal text-texto-tenue">(opcional, hasta 3 JPG, máx 5 MB c/u)</span>
          </label>
          <input
            type="file"
            accept="image/jpeg"
            multiple
            onChange={handleArchivos}
            aria-describedby={archivoError ? 'archivos-error' : undefined}
            className="text-sm text-texto-principal file:mr-3 file:py-2 file:px-3 file:rounded-boton file:border-0 file:text-sm file:bg-superficie-hundida file:text-texto-secundario hover:file:bg-superficie-fria"
          />
          {archivoError && (
            <p id="archivos-error" role="alert" className="text-xs text-error-texto">
              {archivoError}
            </p>
          )}
        </div>

        {errorEnvio && (
          <div role="alert" className="rounded-tarjeta border border-error-borde bg-error-fondo p-3">
            <p className="text-sm text-error-texto">{errorEnvio}</p>
          </div>
        )}

        <Button
          type="submit"
          variante="primario"
          disabled={enviando}
          className="w-full"
        >
          {enviando ? 'Enviando tu pedido…' : 'Enviar mi pedido'}
        </Button>
      </form>
    </section>
  )
}
