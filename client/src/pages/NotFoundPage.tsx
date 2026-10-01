import { EnlaceBoton } from '../components/ui/EnlaceBoton'

/** Vista de una ruta que no existe dentro de la app: dice que paso y da dos salidas. */
export function NotFoundPage() {
  return (
    <section className="max-w-md mx-auto text-center py-12 flex flex-col gap-4">
      <h1 className="text-h2 font-semibold text-texto-principal">No encontramos esta página</h1>
      <p className="text-texto-secundario">
        Puede que el enlace esté incompleto o que la página ya no exista. Desde el catálogo puedes encontrar lo que
        buscas.
      </p>
      <div className="flex gap-3 justify-center">
        <EnlaceBoton to="/catalogo">Ver el catálogo</EnlaceBoton>
        <EnlaceBoton to="/" variante="secundario">
          Ir al inicio
        </EnlaceBoton>
      </div>
    </section>
  )
}
