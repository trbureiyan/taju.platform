import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { api, ErrorApi } from '../lib/api'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Button } from '../components/ui/Button'
import { BotonWhatsApp } from '../components/shared/BotonWhatsApp'
import type { Producto, Pedido } from '../types'
import { ETIQUETAS_FAMILIA } from '../types'
import { calcularPrecioTotal } from '../lib/precio'
import { codigoPedido } from '../lib/pedido'
import { mensajeResumenPedido } from '../lib/mensajePedido'
import { HORAS_DE_ENTREGA, esFestivo } from '../lib/politicas'
import { horaEnPalabras, promesaContacto, relojBogota } from '../lib/horario'
import {
  exigeReferencia,
  normalizarCelular,
  MENSAJE_CELULAR,
  MENSAJE_FALTA_FECHA,
  MENSAJE_FALTA_REFERENCIA,
  REGEX_CELULAR,
} from '../lib/requisitos'

interface Campos {
  dimensionSeleccionada: string
  dimensionCustom: string
  descripcion: string
  cantidad: string
  colores: string
  materiales: string
  telefono: string
  entregaMetodo: string
  entregaDetalle: string
  fechaDeseada: string
  horaDeseada: string
}

interface Errores {
  dimensionCustom?: string
  descripcion?: string
  cantidad?: string
  colores?: string
  materiales?: string
  telefono?: string
  fechaDeseada?: string
  horaDeseada?: string
}

// un dia calendario de margen minimo (hoy no alcanza) - da tiempo al taller a reaccionar antes de empezar a cortar
const DIAS_MINIMOS_ENTREGA = 1

// "hoy" es el del taller en Bogota, no el del dispositivo: un cliente en otra zona no corre la fecha minima
function fechaMinimaEntrega(): string {
  const [y, m, d] = relojBogota(new Date()).fecha.split('-').map(Number)
  // aritmetica en UTC puro para sumar dias sin que la zona del dispositivo mueva la fecha
  return new Date(Date.UTC(y, m - 1, d + DIAS_MINIMOS_ENTREGA)).toISOString().slice(0, 10)
}

// mediodia de Bogota para que ningun corrimiento de zona cambie el dia que se muestra
function fechaEnPalabras(fecha: string): string {
  return new Date(`${fecha}T12:00:00-05:00`).toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'America/Bogota',
  })
}

const MENSAJE_ERROR_ENVIO =
  'No pudimos enviar tu pedido porque algo falló en la conexión con el taller. Tus datos siguen aquí: prueba de nuevo en unos segundos o escríbenos por WhatsApp.'

// mensajes del server escritos para sistema, no para el cliente: se cambian por el de respaldo
const MENSAJES_DE_SISTEMA = new Set(['Datos del pedido inválidos', 'Categoría no encontrada o inactiva', 'Producto no encontrado o inactivo'])

// [DECISION] solo el 409 y los 400 en voz de marca llegan tal cual - una caida de red (TypeError) o un 5xx traen
// texto crudo ("Failed to fetch", "Error 500") que no le dice al cliente que hacer. Mensaje nuevo en 400 sin voz de marca: sumarlo al Set.
function mensajeDeErrorDeEnvio(err: unknown): string {
  if (err instanceof ErrorApi) {
    if (err.estado === 409) return err.message
    if (err.estado === 400 && !MENSAJES_DE_SISTEMA.has(err.message) && !/^Error \d+$/.test(err.message)) {
      return err.message
    }
  }
  return MENSAJE_ERROR_ENVIO
}

const MAX_ARCHIVOS = 3
const MAX_DESCRIPCION = 500

// hora de Colombia fija (-05:00, sin horario de verano): la fecha pedida no depende de la zona del dispositivo
function instanteDeseado(fecha: string, hora: string): string {
  return new Date(`${fecha}T${hora}:00-05:00`).toISOString()
}

const OPCIONES_HORA = HORAS_DE_ENTREGA.map((h) => ({
  valor: `${String(h).padStart(2, '0')}:00`,
  texto: horaEnPalabras(h),
}))

// ─── Componente ───────────────────────────────────────────────────────────────

export function PedidoFormPage() {
  const { productoId } = useParams<{ productoId: string }>()
  const [searchParams] = useSearchParams()
  const pedidoOrigenId = searchParams.get('desde')
  const navigate = useNavigate()

  // producto sobre el que se pide + su carga inicial
  const [producto, setProducto] = useState<Producto | null>(null)
  const [productoInactivo, setProductoInactivo] = useState(false)
  const [cargando, setCargando] = useState(true)
  // "Pedir de nuevo": aviso si el pedido de origen no se pudo leer (404 o red) - el formulario igual abre, vacio
  const [avisoOrigenIlegible, setAvisoOrigenIlegible] = useState(false)

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
    telefono: '',
    entregaMetodo: 'recoger',
    entregaDetalle: '',
    fechaDeseada: '',
    horaDeseada: '',
  })
  const [errores, setErrores] = useState<Errores>({})
  const tituloExito = useRef<HTMLHeadingElement>(null)

  // el formulario se desmonta al crear el pedido: sin mover el foco, el lector de pantalla no anuncia nada
  useEffect(() => {
    if (pedidoCreado) tituloExito.current?.focus()
  }, [pedidoCreado])

  // sin categoria (sin radios) o eligiendo "personalizada" a mano - ambos casos piden el input libre
  const esDimensionPersonalizada =
    !campos.dimensionSeleccionada || campos.dimensionSeleccionada === 'personalizada'

  // ─── Carga del producto ───────────────────────────────────────────────────

  useEffect(() => {
    if (!productoId) return
    api
      .get<Producto>(`/productos/${productoId}`)
      .then((p) => setProducto(p))
      .catch(() => setProductoInactivo(true)) // id invalido o producto de baja
      .finally(() => setCargando(false))
  }, [productoId])

  // "Pedir de nuevo": precarga desde el pedido original, sin fecha (ya paso) ni imagenes (ver spec §5)
  useEffect(() => {
    if (!pedidoOrigenId || !producto) return
    api
      .get<Pedido>(`/pedidos/${pedidoOrigenId}`)
      .then((original) => {
        // ?desde= manipulado a mano puede apuntar a un pedido de otro producto - sus datos no aplican aqui
        if (original.producto._id !== producto._id) return
        const baseCoincidente = producto.categoria.dimensionesBase.find(
          (d) => d.valor === original.dimensiones.valor,
        )
        const personalizada = original.dimensiones.esDimensionPersonalizada || !baseCoincidente
        setCampos((prev) => ({
          ...prev,
          dimensionSeleccionada: personalizada ? 'personalizada' : baseCoincidente!.etiqueta,
          dimensionCustom: personalizada ? String(original.dimensiones.valor) : '',
          descripcion: original.descripcion,
          cantidad: String(original.cantidad),
          colores: original.colores,
          materiales: original.materiales,
          // el celular y la entrega casi siempre se repiten; la fecha no (ya paso) ni las imagenes
          telefono: original.contacto?.telefono ?? prev.telefono,
          entregaMetodo: original.entrega?.metodo ?? prev.entregaMetodo,
          entregaDetalle: original.entrega?.detalle ?? prev.entregaDetalle,
        }))
      })
      .catch(() => setAvisoOrigenIlegible(true)) // 404 o red: el formulario abre vacio, sin bloquear
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedidoOrigenId, producto?._id])

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
      setArchivoError('Solo aceptamos imágenes JPG. Si tu referencia está en otro formato, conviértela o envíanosla por WhatsApp.')
      e.target.value = ''
      return
    }
    if (files.some((f) => f.size > 5 * 1024 * 1024)) {
      setArchivoError('Cada imagen debe pesar menos de 5 MB. Redúcela o envíanosla por WhatsApp.')
      e.target.value = ''
      return
    }
    setArchivos(files)
  }

  // ─── Validacion ───────────────────────────────────────────────────────────
  // espejo de crearPedidoSchema y pedidos.requisitos del server - mismas reglas para dar feedback antes del POST

  function validar(p: Producto): boolean {
    const next: Errores = {}
    if (esDimensionPersonalizada && !campos.dimensionCustom.trim()) {
      next.dimensionCustom = 'Nos falta la medida en centímetros. Sin ella no podemos calcular la proporción de tu pieza.'
    } else if (esDimensionPersonalizada && parseFloat(campos.dimensionCustom) <= 0) {
      next.dimensionCustom = 'El valor debe ser mayor a 0'
    }
    if (!campos.descripcion.trim()) next.descripcion = 'Cuéntanos qué necesitas. Con eso podemos cotizarlo.'
    const qty = parseInt(campos.cantidad, 10)
    if (!campos.cantidad || isNaN(qty) || qty < 1) next.cantidad = 'La cantidad mínima es 1'
    if (!campos.colores.trim()) next.colores = 'Indica los colores que quieres. Los necesitamos para cotizar y producir.'
    if (!campos.materiales.trim()) {
      next.materiales = 'Indica el material. Si no lo sabes, cuéntanos para qué lo vas a usar y te asesoramos.'
    }
    if (!REGEX_CELULAR.test(normalizarCelular(campos.telefono))) next.telefono = MENSAJE_CELULAR

    if (!campos.fechaDeseada) {
      next.fechaDeseada = MENSAJE_FALTA_FECHA
    } else if (campos.fechaDeseada < fechaMinimaEntrega()) {
      next.fechaDeseada = `Esa fecha es muy pronto para producirla. Elige una a partir del ${fechaEnPalabras(fechaMinimaEntrega())}, que es lo mínimo que necesitamos.`
    } else if (esFestivo(campos.fechaDeseada)) {
      next.fechaDeseada = 'Ese día es festivo y el taller no atiende. Elige otro día.'
    }
    if (!campos.horaDeseada) next.horaDeseada = 'Elige la hora en que la necesitas. Con ella coordinamos la entrega.'

    const faltaReferencia = exigeReferencia(p.categoria.familia) && archivos.length === 0
    if (faltaReferencia) setArchivoError(MENSAJE_FALTA_REFERENCIA)

    setErrores(next)
    return Object.keys(next).length === 0 && !faltaReferencia
  }

  // ─── Envio ────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!producto || !validar(producto)) return

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
    fd.append('telefono', normalizarCelular(campos.telefono))
    fd.append('entregaMetodo', campos.entregaMetodo)
    // la direccion escrita antes de volver a "recoger" no debe llegar al pedido ni a la clave de idempotencia
    fd.append('entregaDetalle', campos.entregaMetodo === 'domicilio' ? campos.entregaDetalle : '')
    fd.append('fechaDeseada', instanteDeseado(campos.fechaDeseada, campos.horaDeseada))
    archivos.forEach((f) => fd.append('imagenes', f))

    try {
      // FormData porque van archivos - api.post normal serializa a JSON y no sirve aqui
      const pedido = await api.postForm<Pedido>('/pedidos', fd)
      setPedidoCreado(pedido)
    } catch (err) {
      setErrorEnvio(mensajeDeErrorDeEnvio(err))
    } finally {
      setEnviando(false)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  if (cargando) return <p className="text-texto-secundario">Cargando…</p>

  if (productoInactivo) {
    return (
      <div className="max-w-md mx-auto text-center py-12 flex flex-col gap-4">
        <p className="text-texto-principal">
          {pedidoOrigenId
            ? 'Ese producto ya no está disponible. Mira lo que tenemos parecido en el catálogo.'
            : 'No encontramos este producto. Puede que el taller ya no lo esté ofreciendo.'}
        </p>
        <Link to="/catalogo" className="text-sm font-medium text-texto-principal hover:underline">
          Ir al catálogo
        </Link>
      </div>
    )
  }

  if (!producto) return null

  // pantalla de exito reemplaza el formulario entero, no se muestran los dos a la vez
  if (pedidoCreado) {
    return (
      <div className="max-w-md mx-auto text-center py-12 flex flex-col gap-6">
        <div className="rounded-tarjeta bg-exito-fondo border border-exito-borde p-6">
          <h1 ref={tituloExito} tabIndex={-1} className="text-sm font-medium text-exito-texto mb-1">
            Recibimos tu solicitud
          </h1>
          <p className="text-xs text-exito-texto">
            Código: <span className="font-mono">{codigoPedido(pedidoCreado._id)}</span>
          </p>
        </div>
        <p className="text-sm text-texto-secundario">
          {promesaContacto(new Date())} Hasta que confirmemos contigo el precio, la fecha y el anticipo, no empezamos a
          producir.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variante="primario" onClick={() => navigate('/mis-pedidos')}>
            Ver mis pedidos
          </Button>
          <Button variante="secundario" onClick={() => navigate('/catalogo')}>
            Seguir viendo
          </Button>
        </div>
        {/* comodidad, no mecanismo: la solicitud ya existe en la plataforma aunque el cliente no envie este mensaje */}
        <BotonWhatsApp variante="linea" mensaje={mensajeResumenPedido(pedidoCreado)}>
          Enviar el resumen por WhatsApp
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
  const referenciaObligatoria = exigeReferencia(producto.categoria.familia)

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

      {avisoOrigenIlegible && (
        <p className="mb-6 text-sm text-texto-secundario rounded-tarjeta border border-borde-sutil bg-superficie-hundida p-3">
          No pudimos traer los datos de tu pedido anterior. Puedes completar el formulario igual.
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        {/* radios de dimensionesBase + opcion "personalizada" - o el input libre solo si no hay dimensiones sugeridas */}
        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-medium text-texto-principal">Dimensión</legend>

          {dimensiones.length > 0 && (
            <div className="flex flex-col gap-2">
              {dimensiones.map((d) => (
                <label key={d.etiqueta} className="flex items-center gap-2 min-h-boton cursor-pointer">
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
              <label className="flex items-center gap-2 min-h-boton cursor-pointer">
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
          maxLength={MAX_DESCRIPCION}
          placeholder="Cuéntanos qué necesitas y para qué ocasión"
          hint="Hasta 500 caracteres. Deja lo esencial (estilo, mensaje, detalles) y el resto lo hablamos por WhatsApp."
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
          hint="Indica los colores principales que quieres"
          value={campos.colores}
          onChange={(e) => set('colores', e.target.value)}
          error={errores.colores}
        />

        <Input
          label="Materiales"
          type="text"
          placeholder="Ej: acrílico 3mm, madera terciada"
          hint="Si no sabes qué material, describe el uso y te asesoramos"
          value={campos.materiales}
          onChange={(e) => set('materiales', e.target.value)}
          error={errores.materiales}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Fecha en que la necesitas"
            type="date"
            min={fechaMinimaEntrega()}
            hint="Es la fecha que deseas. La acordamos contigo antes de confirmar."
            value={campos.fechaDeseada}
            onChange={(e) => set('fechaDeseada', e.target.value)}
            error={errores.fechaDeseada}
          />
          <Select
            label="Hora en que la necesitas"
            value={campos.horaDeseada}
            onChange={(e) => set('horaDeseada', e.target.value)}
            error={errores.horaDeseada}
          >
            <option value="">Elige una hora</option>
            {OPCIONES_HORA.map((o) => (
              <option key={o.valor} value={o.valor}>
                {o.texto}
              </option>
            ))}
          </Select>
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-medium text-texto-principal">Cómo recibes tu pedido</legend>
          <label className="flex items-center gap-2 min-h-boton cursor-pointer">
            <input
              type="radio"
              name="entregaMetodo"
              value="recoger"
              checked={campos.entregaMetodo === 'recoger'}
              onChange={(e) => set('entregaMetodo', e.target.value)}
              className="accent-accion"
            />
            <span className="text-sm text-texto-principal">Lo recojo en el taller</span>
          </label>
          <label className="flex items-center gap-2 min-h-boton cursor-pointer">
            <input
              type="radio"
              name="entregaMetodo"
              value="domicilio"
              checked={campos.entregaMetodo === 'domicilio'}
              onChange={(e) => set('entregaMetodo', e.target.value)}
              className="accent-accion"
            />
            <span className="text-sm text-texto-principal">Lo quiero a domicilio en Neiva</span>
          </label>
          {campos.entregaMetodo === 'domicilio' && (
            <Input
              label="Barrio o dirección"
              type="text"
              autoComplete="street-address"
              maxLength={200}
              hint="Puedes dejarlo para después: la dirección exacta la confirmamos contigo antes de fijar la fecha."
              value={campos.entregaDetalle}
              onChange={(e) => set('entregaDetalle', e.target.value)}
            />
          )}
        </fieldset>

        <Input
          label="Tu celular"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="Ej: 319 245 2842"
          hint="Es el número por el que te escribimos para confirmar precio, fecha y anticipo."
          value={campos.telefono}
          onChange={(e) => set('telefono', e.target.value)}
          error={errores.telefono}
        />

        {precioEstimado && (
          <div className="rounded-tarjeta border border-borde-sutil bg-superficie-hundida p-4">
            <p className="text-sm text-texto-secundario">Precio estimado</p>
            <p className="text-lg font-semibold text-texto-principal tabular-nums">
              ${precioEstimado.total.toLocaleString('es-CO')}
            </p>
            <p className="text-xs text-texto-tenue">
              ${precioEstimado.unitario.toLocaleString('es-CO')} c/u × {campos.cantidad}. Es una referencia: el
              precio final lo confirmamos contigo.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label htmlFor="imagenes-referencia" className="text-sm font-medium text-texto-principal">
            Imágenes de referencia
            <span className="ml-1 font-normal text-texto-tenue">
              {referenciaObligatoria
                ? '(obligatoria, hasta 3 JPG, máx 5 MB c/u)'
                : '(opcional, hasta 3 JPG, máx 5 MB c/u)'}
            </span>
          </label>
          {pedidoOrigenId && (
            <p className="text-xs text-texto-tenue">
              Si quieres usar las mismas imágenes de referencia, adjúntalas de nuevo.
            </p>
          )}
          <input
            id="imagenes-referencia"
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

        <div className="flex flex-col gap-2">
          <Button type="submit" variante="primario" disabled={enviando} className="w-full">
            {enviando ? 'Enviando tu pedido…' : 'Enviar mi pedido'}
          </Button>
          <p className="text-xs text-texto-secundario text-center">
            Enviar no te compromete a nada: primero confirmamos contigo el precio, la fecha y el anticipo.
          </p>
        </div>
      </form>
    </section>
  )
}
