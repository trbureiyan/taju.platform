import { useMemo } from 'react'
import { useCatalogo } from '../hooks/useCatalogo'
import { useFiltrosCatalogo } from '../hooks/useFiltrosCatalogo'
import { filtrarProductos, ordenarProductos, agruparPorFamilia } from '../lib/catalogo'
import { CabeceraCatalogo } from '../components/catalog/CabeceraCatalogo'
import { NavFamilias } from '../components/catalog/NavFamilias'
import { BarraCatalogo } from '../components/catalog/BarraCatalogo'
import { EstanteFamilia } from '../components/catalog/EstanteFamilia'
import { GrillaProductos } from '../components/catalog/GrillaProductos'
import { EstadoVacioCatalogo } from '../components/catalog/EstadoVacioCatalogo'
import { EsperaTaller } from '../components/shared/EsperaTaller'
import { Button } from '../components/ui/Button'

export function CatalogoPage() {
  const { productos, cargando, error, reintentar } = useCatalogo()
  const { familia, q, orden, ocasion, actualizar, limpiar, hrefFamilia } = useFiltrosCatalogo()

  // coleccion por ocasion es una lente de UI sobre especificacionesTecnicas, no una entidad de dominio nueva -
  // las 4 familias siguen siendo la taxonomia real (ver AGENTS.md); esto solo agrupa lo que el taller ya etiqueto
  const ocasiones = useMemo(() => {
    const vistas = new Set<string>()
    for (const p of filtrarProductos(productos, { familia, q: '', ocasion: null })) {
      const valor = p.especificacionesTecnicas.ocasion
      if (valor) vistas.add(valor)
    }
    return [...vistas].sort((a, b) => a.localeCompare(b, 'es'))
  }, [productos, familia])

  const visibles = useMemo(
    () => ordenarProductos(filtrarProductos(productos, { familia, q, ocasion }), orden),
    [productos, familia, q, ocasion, orden]
  )
  // estantes solo en la vista abierta: apenas hay busqueda u ocasion, una sola grilla es mas facil de recorrer
  const enEstantes = !familia && !q && !ocasion

  return (
    <>
      <CabeceraCatalogo familia={familia}>
        <NavFamilias activa={familia} href={hrefFamilia} />
      </CabeceraCatalogo>

      <BarraCatalogo
        q={q}
        orden={orden}
        ocasiones={ocasiones}
        ocasion={ocasion}
        total={cargando || error ? null : visibles.length}
        alBuscar={(texto) => actualizar({ q: texto }, true)}
        alOrdenar={(nuevo) => actualizar({ orden: nuevo })}
        alElegirOcasion={(nueva) => actualizar({ ocasion: nueva })}
      />

      {/* cuatro estados excluyentes: cargando / error / vacio / con resultados */}
      <div className="w-full max-w-contenedor mx-auto px-4 py-12">
        {cargando && <EsperaTaller />}

        {error && (
          <div
            role="alert"
            className="flex flex-col items-start gap-4 rounded-tarjeta border border-error-borde bg-error-fondo p-6"
          >
            <p className="font-medium text-error-texto">No pudimos traer el catálogo</p>
            <p className="text-sm text-error-texto">
              Tuvimos un problema para traer los productos. Prueba de nuevo en unos segundos.
            </p>
            <Button variante="secundario" onClick={reintentar}>
              Probar de nuevo
            </Button>
          </div>
        )}

        {!cargando && !error && visibles.length === 0 && (
          <EstadoVacioCatalogo alLimpiar={limpiar} />
        )}

        {!cargando &&
          !error &&
          visibles.length > 0 &&
          (enEstantes ? (
            <div className="flex flex-col gap-16">
              {agruparPorFamilia(visibles).map((g) => (
                <EstanteFamilia
                  key={g.familia}
                  familia={g.familia}
                  productos={g.productos}
                  href={hrefFamilia(g.familia)}
                />
              ))}
            </div>
          ) : (
            <GrillaProductos productos={visibles} mostrarFamilia={!familia} />
          ))}
      </div>
    </>
  )
}
