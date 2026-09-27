import { EnlaceBoton } from '../ui/EnlaceBoton'
import { rutaFamilia } from './contenido'

const DATOS = [
  { dato: 'Pedido mínimo de 12 unidades', porque: 'Así podemos preparar el material y la máquina una sola vez para tu lote.' },
  { dato: 'Precio por escala, desde 12 y desde 100 unidades', porque: 'Mientras más unidades pides, menos pagas por cada una.' },
  { dato: 'Cada precio está en el catálogo', porque: 'Lo ves antes de pedir, sin tener que escribirnos para cotizar.' },
]

// [?] solo 15, 22 y 40 cm estan fijados en los documentos de marca; el resto de la tabla espera al taller (spec §13)
const MEDIDAS = [
  { cm: 15, referencia: 'octavo de libra' },
  { cm: 22, referencia: 'media libra' },
  { cm: 40, referencia: 'dos libras' },
]

// [DECISION] sin precios en la Vitrina - las escalas viven por producto en precio.escalas (Producto.ts). Copiarlas
// aqui dejaria una segunda fuente que queda vieja en el primer cambio desde el admin. La franja explica el modelo.
export function FranjaVolumen() {
  return (
    <section
      id="por-volumen"
      aria-labelledby="volumen-titulo"
      className="bg-contexto text-contexto-texto px-4 py-16 lg:py-24 scroll-mt-16"
    >
      <div className="w-full max-w-contenedor mx-auto grid gap-12 lg:grid-cols-2">
        <div className="flex flex-col items-start gap-6">
          <p className="text-sm font-medium uppercase">Para reposterías, panaderías y eventos</p>
          <h2 id="volumen-titulo" className="text-h2">
            Si compras por volumen, el precio baja por escala.
          </h2>
          <ul className="flex flex-col gap-4">
            {DATOS.map(({ dato, porque }) => (
              <li key={dato}>
                <p className="font-semibold">{dato}</p>
                <p className="text-sm">{porque}</p>
              </li>
            ))}
          </ul>
          <EnlaceBoton to={rutaFamilia('superficies')} variante="secundario">
            Ver blondas y bases
          </EnlaceBoton>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="text-h3">Medidas de blondas y bases</h3>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-borde-fuerte text-sm">
                <th scope="col" className="py-2 font-medium">Medida</th>
                <th scope="col" className="py-2 font-medium">Para una torta de</th>
              </tr>
            </thead>
            <tbody>
              {MEDIDAS.map(({ cm, referencia }) => (
                <tr key={cm} className="border-b border-borde-fuerte">
                  <td className="py-3 font-semibold medida">{cm} cm</td>
                  <td className="py-3">{referencia}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
