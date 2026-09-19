import { useState } from 'react'
import { FiltroFamilia } from '../components/catalog/FiltroFamilia'
import { ProductoCard } from '../components/catalog/ProductoCard'
import { useCatalogo } from '../hooks/useCatalogo'
import type { Familia } from '../types'

export function CatalogoPage() {
  const [familia, setFamilia] = useState<Familia | null>(null)
  const { productos, cargando, error } = useCatalogo(familia)

  return (
    <section>
      <h1 className="text-2xl font-semibold text-texto-principal mb-6">Catálogo</h1>

      <FiltroFamilia seleccionada={familia} onChange={setFamilia} />

      {/* cuatro estados excluyentes: cargando / error / vacio / con resultados - solo uno se pinta a la vez */}
      <div className="mt-8">
        {cargando && (
          <p className="text-texto-secundario">Cargando productos...</p>
        )}

        {error && (
          <div role="alert" className="rounded-tarjeta border border-error-borde bg-error-fondo p-4">
            <p className="text-sm font-medium text-error-texto">No pudimos cargar el catálogo</p>
            <p className="text-sm text-error-texto mt-1">
              Hubo un problema al conectar con el servidor. Intentá de nuevo en unos segundos.
            </p>
          </div>
        )}

        {!cargando && !error && productos.length === 0 && (
          <p className="text-texto-secundario">
            No hay productos en esta categoría por el momento.
          </p>
        )}

        {!cargando && !error && productos.length > 0 && (
          <ul
            className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            aria-label="Productos del catálogo"
          >
            {productos.map((p) => (
              <li key={p._id}>
                <ProductoCard producto={p} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
