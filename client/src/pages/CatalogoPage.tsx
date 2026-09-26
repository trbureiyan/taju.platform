import { useMemo, useState } from 'react'
import { FiltroFamilia } from '../components/catalog/FiltroFamilia'
import { FiltroOcasion } from '../components/catalog/FiltroOcasion'
import { ProductoCard } from '../components/catalog/ProductoCard'
import { useCatalogo } from '../hooks/useCatalogo'
import type { Familia } from '../types'

export function CatalogoPage() {
  const [familia, setFamilia] = useState<Familia | null>(null)
  const [ocasion, setOcasion] = useState<string | null>(null)
  const { productos, cargando, error } = useCatalogo(familia)

  // coleccion por ocasion es una lente de UI sobre especificacionesTecnicas, no una entidad de dominio nueva -
  // las 4 familias siguen siendo el taxonomia real (ver AGENTS.md); esto solo agrupa lo que el taller ya etiqueto
  const ocasiones = useMemo(() => {
    const vistas = new Set<string>()
    for (const p of productos) {
      const valor = p.especificacionesTecnicas.ocasion
      if (valor) vistas.add(valor)
    }
    return [...vistas].sort()
  }, [productos])

  const productosFiltrados = ocasion
    ? productos.filter((p) => p.especificacionesTecnicas.ocasion === ocasion)
    : productos

  return (
    <section>
      <h1 className="text-2xl font-semibold text-texto-principal mb-6">Catálogo</h1>

      <div className="flex flex-col gap-4">
        <FiltroFamilia seleccionada={familia} onChange={setFamilia} />
        <FiltroOcasion ocasiones={ocasiones} seleccionada={ocasion} onChange={setOcasion} />
      </div>

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

        {!cargando && !error && productosFiltrados.length === 0 && (
          <p className="text-texto-secundario">
            No hay productos en esta categoría por el momento.
          </p>
        )}

        {!cargando && !error && productosFiltrados.length > 0 && (
          <ul
            className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            aria-label="Productos del catálogo"
          >
            {productosFiltrados.map((p) => (
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
