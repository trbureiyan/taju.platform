import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { api } from '../lib/api'
import { Button } from '../components/ui/Button'
import { AnilloProgreso } from '../components/ui/AnilloProgreso'
import { BotonWhatsApp } from '../components/shared/BotonWhatsApp'
import { HojaResumen } from '../components/pedido/HojaResumen'
import { BarraAcciones } from '../components/pedido/BarraAcciones'
import { MomentoQue } from '../components/pedido/MomentoQue'
import { MomentoComo } from '../components/pedido/MomentoComo'
import { MomentoCuando } from '../components/pedido/MomentoCuando'
import { MomentoRepaso } from '../components/pedido/MomentoRepaso'
import { useSolicitud } from '../hooks/useSolicitud'
import { MOMENTOS } from '../lib/validarSolicitud'
import { exigeReferencia } from '../lib/requisitos'
import { resumenDesdeCampos, resumenDesdePedido } from '../lib/resumenPedido'
import { mensajeResumenPedido } from '../lib/mensajePedido'
import { promesaContacto } from '../lib/horario'
import { codigoPedido } from '../lib/pedido'
import { ETIQUETAS_FAMILIA } from '../types'
import type { Pedido, Producto } from '../types'

// ventana tras llegar al repaso en la que un envio se toma como el segundo toque de un doble toque en Siguiente
const GRACIA_REPASO_MS = 500

/**
 * Formulario de solicitud en cuatro momentos (que, como, cuando, repaso). Esta pagina es la carcasa: carga el
 * producto, precarga "Pedir de nuevo", muestra el progreso y el momento activo, y la pantalla de exito. El estado,
 * la validacion por momento y el envio viven en useSolicitud.
 */
export function PedidoFormPage() {
  const { productoId } = useParams<{ productoId: string }>()
  const [searchParams] = useSearchParams()
  const pedidoOrigenId = searchParams.get('desde')
  const navigate = useNavigate()

  const [producto, setProducto] = useState<Producto | null>(null)
  const [productoInactivo, setProductoInactivo] = useState(false)
  const [cargando, setCargando] = useState(true)
  // "Pedir de nuevo": aviso si el pedido de origen no se pudo leer (404 o red) - el formulario igual abre, vacio
  const [avisoOrigenIlegible, setAvisoOrigenIlegible] = useState(false)
  // pedidoCreado no-null es lo que dispara la pantalla de "listo"
  const [pedidoCreado, setPedidoCreado] = useState<Pedido | null>(null)

  const solicitud = useSolicitud(producto)
  const { campos, errores, paso, fallos, precargar } = solicitud
  const tituloExito = useRef<HTMLHeadingElement>(null)
  const tituloMomento = useRef<HTMLHeadingElement>(null)
  const formulario = useRef<HTMLFormElement>(null)
  // ultimo momento cuyo titulo ya se enfoco; null hasta la primera vista del formulario
  const momentoEnfocado = useRef<number | null>(null)
  // ultimo intento fallido cuyo foco ya se atendio
  const falloAtendido = useRef(0)
  // cuando se entro al repaso; 0 fuera de el
  const entradaAlRepaso = useRef(0)

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
        const baseCoincidente = producto.categoria.dimensionesBase.find((d) => d.valor === original.dimensiones.valor)
        const personalizada = original.dimensiones.esDimensionPersonalizada || !baseCoincidente
        precargar({
          dimensionSeleccionada: personalizada ? 'personalizada' : baseCoincidente!.etiqueta,
          dimensionCustom: personalizada ? String(original.dimensiones.valor) : '',
          descripcion: original.descripcion,
          cantidad: String(original.cantidad),
          colores: original.colores,
          materiales: original.materiales,
          // el celular y la entrega casi siempre se repiten; la fecha no (ya paso) ni las imagenes
          ...(original.contacto?.telefono ? { telefono: original.contacto.telefono } : {}),
          ...(original.entrega
            ? { entregaMetodo: original.entrega.metodo, entregaDetalle: original.entrega.detalle ?? '' }
            : {}),
        })
      })
      .catch(() => setAvisoOrigenIlegible(true)) // 404 o red: el formulario abre vacio, sin bloquear
    // precargar cambia en cada render del hook; la precarga corre una vez por pedido de origen y producto
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedidoOrigenId, producto?._id])

  // al cambiar de momento el foco pasa a su titulo: quien usa lector de pantalla oye donde esta.
  // [DECISION] la primera vista del momento 1 no mueve el foco: la pagina recien cargada ya se anuncio y robarlo
  // saltaria las migas y la tarjeta del producto. Se compara contra el ultimo momento enfocado (no un booleano)
  // para que el doble efecto de StrictMode tampoco lo robe, y volver al 1 con Atras si lo enfoca.
  useEffect(() => {
    if (!producto || pedidoCreado) return
    if (momentoEnfocado.current === null) {
      momentoEnfocado.current = paso
      return
    }
    if (momentoEnfocado.current === paso) return
    momentoEnfocado.current = paso
    tituloMomento.current?.focus()
  }, [paso, producto, pedidoCreado])

  // tras un intento fallido el foco va al primer campo marcado, una vez por intento. Depende tambien de paso: cuando
  // enviar() devuelve al cliente a un momento anterior, react-router cambia la URL en una transicion, asi que fallos
  // se aplica aun en el repaso (sin campos marcados) y el momento con el error llega en un render posterior.
  // Declarado despues del efecto del titulo para ganarle en ese render.
  useEffect(() => {
    if (fallos <= falloAtendido.current) return
    const invalido = formulario.current?.querySelector<HTMLElement>('[aria-invalid="true"]')
    if (!invalido) return
    falloAtendido.current = fallos
    invalido.focus()
  }, [fallos, paso])

  useEffect(() => {
    entradaAlRepaso.current = paso === 4 ? Date.now() : 0
  }, [paso])

  // el formulario se desmonta al crear el pedido: sin mover el foco, el lector de pantalla no anuncia nada
  useEffect(() => {
    if (pedidoCreado) tituloExito.current?.focus()
  }, [pedidoCreado])

  async function alEnviarFormulario(e: React.FormEvent) {
    e.preventDefault()
    // Enter en un campo de los momentos 1 a 3 avanza; solo el repaso envia
    if (paso < 4) {
      solicitud.siguiente()
      return
    }
    // [DECISION] "Enviar mi pedido" ocupa el lugar de "Siguiente": un doble toque en el momento 3 enviaria sin que el
    // cliente vea el repaso. Un envio dentro de medio segundo de llegar al repaso se ignora; el boton sigue activo.
    if (Date.now() - entradaAlRepaso.current < GRACIA_REPASO_MS) return
    const creado = await solicitud.enviar()
    if (creado) setPedidoCreado(creado)
  }

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
    // lo enviado ya no tiene nada "Pendiente": una linea sin valor (pedido sin fecha, celular que no es de
    // 10 digitos) se omite en vez de pedirle al cliente algo que aqui ya no puede responder
    const lineasEnviadas = resumenDesdePedido(pedidoCreado).filter((l) => l.valor !== null)
    return (
      <div className="max-w-md mx-auto text-center py-12 flex flex-col gap-6">
        <div className="rounded-tarjeta bg-exito-fondo border border-exito-borde p-6">
          <h1 ref={tituloExito} tabIndex={-1} className="text-sm font-medium text-exito-texto mb-1 outline-none">
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
        <HojaResumen lineas={lineasEnviadas} titulo="Lo que enviaste" className="text-left lg:static lg:max-h-none" />
        <div className="flex flex-wrap gap-3 justify-center">
          <Button variante="primario" onClick={() => navigate('/mis-pedidos')}>
            Ver mis pedidos
          </Button>
          <Button variante="secundario" onClick={() => navigate('/catalogo')}>
            Seguir viendo el catálogo
          </Button>
        </div>
        {/* comodidad, no mecanismo: la solicitud ya existe en la plataforma aunque el cliente no envie este mensaje */}
        <BotonWhatsApp variante="linea" mensaje={mensajeResumenPedido(pedidoCreado)}>
          Enviar el resumen por WhatsApp
        </BotonWhatsApp>
      </div>
    )
  }

  const titulo = MOMENTOS[paso - 1].titulo
  const propsMomento = { producto, campos, errores, set: solicitud.set, tituloRef: tituloMomento, intento: fallos }

  return (
    <section className="flex flex-col gap-6">
      <nav aria-label="Ruta de navegación">
        <ol className="flex flex-wrap items-center gap-2 text-sm text-texto-tenue">
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

      {/* en el movil una sola linea compacta: el alto de la pantalla es para el momento */}
      <div className="flex items-baseline gap-2 rounded-tarjeta border border-borde-sutil bg-superficie-hundida px-4 py-3 lg:flex-col lg:items-start lg:gap-1 lg:p-4">
        <p className="shrink-0 text-xs text-texto-tenue uppercase tracking-wide">
          {ETIQUETAS_FAMILIA[producto.categoria.familia]}
        </p>
        <p className="min-w-0 truncate font-semibold text-texto-principal">{producto.nombre}</p>
        <p className="hidden text-sm text-texto-secundario lg:block">{producto.categoria.nombre}</p>
      </div>

      <header className="sticky top-0 z-encabezado -mx-4 flex items-center gap-3 border-b border-borde-sutil bg-superficie-base px-4 py-3 lg:hidden">
        <AnilloProgreso paso={paso} titulo={titulo} tamano="compacto" />
        {/* aria-hidden: el anillo ya dice "Paso X de 4: titulo" y el h2 del momento repite el titulo */}
        <div aria-hidden="true">
          <p className="text-xs text-texto-secundario">Paso {paso} de 4</p>
          <p className="text-base font-semibold text-texto-principal">{titulo}</p>
        </div>
      </header>
      <div className="hidden lg:flex lg:items-center lg:gap-6">
        <AnilloProgreso paso={paso} titulo={titulo} tamano="grande" />
        <div>
          <p className="text-sm text-texto-secundario">Paso {paso} de 4</p>
          <p className="text-h3 font-semibold text-texto-principal">{titulo}</p>
        </div>
      </div>

      {avisoOrigenIlegible && (
        <p className="text-sm text-texto-secundario rounded-tarjeta border border-borde-sutil bg-superficie-hundida p-3">
          No pudimos traer los datos de tu pedido anterior. Puedes completar el formulario igual.
        </p>
      )}

      <div className="lg:grid lg:grid-cols-3 lg:gap-12">
        {/* pb-24: en el movil la barra de acciones es fija abajo y taparia el ultimo campo */}
        <form
          ref={formulario}
          onSubmit={alEnviarFormulario}
          noValidate
          className="flex flex-col gap-6 pb-24 lg:col-span-2 lg:pb-0"
        >
          {paso === 1 && <MomentoQue {...propsMomento} />}
          {paso === 2 && (
            <MomentoComo
              {...propsMomento}
              archivos={solicitud.archivos}
              cambiarArchivos={solicitud.cambiarArchivos}
              onProcesando={solicitud.marcarProcesando}
              desdeOtroPedido={Boolean(pedidoOrigenId)}
            />
          )}
          {paso === 3 && <MomentoCuando {...propsMomento} />}
          {paso === 4 && (
            <MomentoRepaso {...propsMomento} archivos={solicitud.archivos} errorEnvio={solicitud.errorEnvio} />
          )}
          <BarraAcciones
            paso={paso}
            onAtras={solicitud.atras}
            enviando={solicitud.enviando}
            procesando={solicitud.procesando}
          />
        </form>

        {/* en el repaso la hoja ya es el contenido: dos hojas a la vez repetirian el resumen */}
        {paso < 4 && (
          <aside className="hidden lg:block">
            <HojaResumen
              lineas={resumenDesdeCampos(campos, producto, {
                cantidad: solicitud.archivos.length,
                obligatoria: exigeReferencia(producto.categoria.familia),
              })}
            />
          </aside>
        )}
      </div>
    </section>
  )
}
