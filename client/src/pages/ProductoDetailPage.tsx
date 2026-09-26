import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useProducto } from '../hooks/useProducto'
import { Button } from '../components/ui/Button'
import { EsperaTaller } from '../components/shared/EsperaTaller'
import { BotonWhatsApp } from '../components/shared/BotonWhatsApp'
import { GaleriaProducto } from '../components/producto/GaleriaProducto'
import { BloquePrecio } from '../components/producto/BloquePrecio'
import { AntesDePedir } from '../components/producto/AntesDePedir'
import { FranjaEspecificaciones } from '../components/producto/FranjaEspecificaciones'
import { MasDeFamilia } from '../components/producto/MasDeFamilia'
import { BarraPedidoMovil } from '../components/producto/BarraPedidoMovil'
import { ETIQUETAS_FAMILIA } from '../types'
import type { Producto } from '../types'
import { rutaFamilia } from '../components/vitrina/contenido'

// key por id: pasar de un producto a otro ("Mas toppers") reinicia el estado sin setState dentro de un efecto
export function ProductoDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const inicial = (useLocation().state as { producto?: Producto } | null)?.producto
  return <DetalleProducto key={id} id={id} inicial={inicial?._id === id ? inicial : undefined} />
}

function DetalleProducto({ id, inicial }: { id: string; inicial?: Producto }) {
  const navigate = useNavigate()
  const { autenticado } = useAuth()
  const { producto, estado, reintentar } = useProducto(id, inicial)

  const envoltura = 'w-full max-w-contenedor mx-auto px-4 py-12'

  if (estado === 'cargando') {
    return (
      <div className={envoltura}>
        <EsperaTaller mensaje="Estamos preparando el producto" />
      </div>
    )
  }

  if (estado === 'no-encontrado') {
    return (
      <div className={[envoltura, 'flex flex-col items-start gap-4'].join(' ')}>
        <p className="text-lg text-texto-principal">No encontramos este producto. Puede que el taller ya no lo esté ofreciendo.</p>
        <Link to="/catalogo" className="inline-flex items-center min-h-boton font-medium underline underline-offset-4">
          Volver al catálogo
        </Link>
      </div>
    )
  }

  if (estado === 'error' || !producto) {
    return (
      <div className={envoltura}>
        <div role="alert" className="flex flex-col items-start gap-4 rounded-tarjeta border border-error-borde bg-error-fondo p-6">
          <p className="font-medium text-error-texto">No pudimos traer este producto</p>
          <p className="text-sm text-error-texto">Tuvimos un problema de conexión. Prueba de nuevo en unos segundos.</p>
          <Button variante="secundario" onClick={reintentar}>
            Probar de nuevo
          </Button>
        </div>
      </div>
    )
  }

  const familia = producto.categoria.familia
  // LoginPage lee ?redirect= y vuelve exactamente al pedido despues de ingresar
  function alPedir() {
    navigate(autenticado ? `/pedido/${producto!._id}` : `/login?redirect=/pedido/${producto!._id}`)
  }

  return (
    // pb extra en telefono: la barra fija inferior no debe tapar el final de la pagina
    <article className={[envoltura, 'flex flex-col gap-16 pb-24 lg:pb-12'].join(' ')}>
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <GaleriaProducto producto={producto} />

        <div className="flex flex-col gap-6">
          <nav aria-label="Ruta de navegación">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-texto-secundario">
              <li>
                <Link to="/catalogo" className="hover:text-texto-principal">
                  Catálogo
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link to={rutaFamilia(familia)} className="hover:text-texto-principal">
                  {ETIQUETAS_FAMILIA[familia]}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-texto-principal">
                {producto.nombre}
              </li>
            </ol>
          </nav>

          <div className="flex flex-col gap-2">
            <h1 className="text-h1 lg:text-display-xl text-texto-principal">{producto.nombre}</h1>
            <p className="text-sm text-texto-secundario">{producto.categoria.nombre}</p>
          </div>

          <p className="text-texto-principal">{producto.descripcionTecnica}</p>

          <div className="flex flex-col gap-4">
            <BloquePrecio precio={producto.precio} />
            {/* en telefono la accion vive en la barra fija: dos botones amarillos en pantalla romperian la regla */}
            <Button onClick={alPedir} tamano="lg" className="hidden lg:inline-flex">
              Empezar mi pedido
            </Button>
            {/* WhatsApp contextual: el flotante generico se oculta en esta ruta (Layout), uno solo en pantalla */}
            <BotonWhatsApp mensaje={`Hola, tengo una pregunta sobre el ${producto.nombre}.`}>
              Pregúntanos por WhatsApp
            </BotonWhatsApp>
          </div>

          <AntesDePedir familia={familia} />
        </div>
      </div>

      <FranjaEspecificaciones producto={producto} />
      <MasDeFamilia producto={producto} />
      <BarraPedidoMovil precio={producto.precio} alPedir={alPedir} />
    </article>
  )
}
