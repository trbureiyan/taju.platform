import { EnlaceBoton } from '../ui/EnlaceBoton'

// los mismos datos que pide el formulario de pedido: la Vitrina enseña a pedir antes de pedir
const COMPLETAN = [
  'el diámetro de tu torta, de borde a borde.',
  'la altura, desde la base hasta arriba.',
  'el nombre y la edad, tal como los quieres ver.',
  'la fecha de tu celebración.',
]

export function FrasesQueCompletan() {
  return (
    <section aria-labelledby="frases-titulo" className="bg-superficie-base px-4 py-24">
      <div className="w-full max-w-contenedor mx-auto grid gap-8 lg:grid-cols-2 lg:gap-12">
        <h2 id="frases-titulo" className="text-h2 text-texto-principal">
          Para que tu topper salga bien, necesitamos…
        </h2>
        <div className="flex flex-col items-start gap-8">
          <ul className="flex flex-col gap-4">
            {COMPLETAN.map((f) => (
              <li key={f} className="text-h3 font-semibold text-texto-principal">
                {f}
              </li>
            ))}
          </ul>
          <p className="text-lg text-texto-secundario">Con eso, sale bien.</p>
          <EnlaceBoton to="/catalogo">Ver el catálogo</EnlaceBoton>
        </div>
      </div>
    </section>
  )
}
