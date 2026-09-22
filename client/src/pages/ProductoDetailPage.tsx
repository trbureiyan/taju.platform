import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/ui/Button'
import type { Producto } from '../types'
import { ETIQUETAS_FAMILIA } from '../types'
import { formatearPrecio } from '../lib/precio'

const PLACEHOLDER = 'https://placehold.co/600x400/f5f0eb/9b8b7a?text=TaJú'

export function ProductoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { autenticado } = useAuth()
  const [producto, setProducto] = useState<Producto | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (!id) return
    let cancelado = false
    // reset explícito: evita mostrar el producto anterior mientras el nuevo aun carga — intencional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProducto(null)
    setCargando(true)
    api
      .get<Producto>(`/productos/${id}`)
      .then((p) => { if (!cancelado) setProducto(p) })
      .catch(() => { if (!cancelado) navigate('/catalogo', { replace: true }) }) // id invalido o producto dado de baja, no rompemos la pagina
      .finally(() => { if (!cancelado) setCargando(false) })
    return () => { cancelado = true }
  }, [id, navigate])

  if (cargando) {
    return <p className="text-texto-secundario">Cargando producto…</p>
  }

  if (!producto) return null // ya redirigio en el catch de arriba, esto es solo el frame intermedio antes de irse

  const imagenPrincipal = producto.imagenes[0] ?? PLACEHOLDER

  // LoginPage lee ?redirect= y vuelve exactamente aca despues de loguearse (ver client-auth)
  function handleSolicitar() {
    if (autenticado) {
      navigate(`/pedido/${producto!._id}`)
    } else {
      navigate(`/login?redirect=/pedido/${producto!._id}`)
    }
  }

  return (
    <article className="max-w-4xl">
      <nav aria-label="Ruta de navegación" className="mb-6">
        <ol className="flex items-center gap-2 text-sm text-texto-tenue">
          <li><Link to="/catalogo" className="hover:text-texto-principal">Catálogo</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-texto-secundario">{producto.nombre}</li>
        </ol>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="rounded-tarjeta overflow-hidden bg-superficie-hundida aspect-square">
          <img
            src={imagenPrincipal}
            alt={producto.nombre}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <span className="text-xs font-medium text-accion uppercase tracking-wide">
              {ETIQUETAS_FAMILIA[producto.categoria.familia]}
            </span>
            <h1 className="text-h2 font-semibold text-texto-principal mt-1">
              {producto.nombre}
            </h1>
            <p className="text-sm text-texto-secundario mt-1">
              {producto.categoria.nombre}
            </p>
          </div>

          <p className="text-base text-texto-principal">{producto.descripcionTecnica}</p>

          <p className="text-lg font-semibold text-texto-principal tabular-nums">
            {formatearPrecio(producto.precio)}
          </p>

          {/* Map -> Record se vuelve objeto plano al pasar por JSON, por eso Object.entries funciona directo */}
          {Object.keys(producto.especificacionesTecnicas).length > 0 && (
            <dl className="rounded-tarjeta border border-borde-sutil bg-superficie-hundida p-4 grid grid-cols-2 gap-x-4 gap-y-2">
              {Object.entries(producto.especificacionesTecnicas).map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-texto-tenue">{k}</dt>
                  <dd className="text-sm font-medium text-texto-principal">{v}</dd>
                </div>
              ))}
            </dl>
          )}

          {producto.categoria.dimensionesBase.length > 0 && (
            <div>
              <p className="text-sm font-medium text-texto-principal mb-2">
                Dimensiones disponibles
              </p>
              <ul className="flex flex-wrap gap-2">
                {producto.categoria.dimensionesBase.map((d) => (
                  <li
                    key={d.etiqueta}
                    className="px-3 py-1 rounded-full border border-borde-medio text-sm text-texto-secundario"
                  >
                    {d.etiqueta}: {d.valor} {d.unidad}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-auto pt-4">
            <Button variante="primario" onClick={handleSolicitar} className="w-full">
              Solicitar pedido personalizado
            </Button>
          </div>
        </div>
      </div>

      {producto.imagenes.length > 1 && (
        <ul className="flex gap-3 mt-6 overflow-x-auto" aria-label="Galería de imágenes">
          {producto.imagenes.map((url, i) => (
            <li key={i} className="shrink-0 w-20 h-20 rounded-md overflow-hidden bg-superficie-hundida">
              <img src={url} alt={`${producto.nombre} vista ${i + 1}`} className="w-full h-full object-cover" />
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}
