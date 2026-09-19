import type { Producto } from '../../types'

interface ProductoCardProps {
  producto: Producto
}

// [!] placeholder externo, no bundleado - si el producto todavia no tiene fotos subidas
const PLACEHOLDER = 'https://placehold.co/400x400/e2e8f0/94a3b8?text=Sin+imagen'

export function ProductoCard({ producto }: ProductoCardProps) {
  const imagenSrc = producto.imagenes[0] ?? PLACEHOLDER

  return (
    <article className="rounded-tarjeta border border-borde-defecto bg-superficie-elevada overflow-hidden hover:shadow-tarjeta transition-shadow">
      <div className="aspect-square overflow-hidden bg-superficie-hundida">
        <img
          src={imagenSrc}
          alt={producto.nombre}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="p-4 flex flex-col gap-2">
        <h3 className="font-medium text-texto-principal leading-snug">{producto.nombre}</h3>
        <p className="text-sm text-texto-secundario line-clamp-2">{producto.descripcionTecnica}</p>
        {/* [!] <a> nativo en vez de <Link> de react-router - hace reload completo, y si el cliente esta
            logueado le tira la sesion en memoria (mismo problema que en LoginPage/RegistrarPage) */}
        <a
          href={`/catalogo/${producto._id}`}
          className="mt-auto text-sm font-medium text-accion hover:underline focus-visible:outline-none focus-visible:shadow-foco rounded-sm"
        >
          Ver detalles
        </a>
      </div>
    </article>
  )
}
