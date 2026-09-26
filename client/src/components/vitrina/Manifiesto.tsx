// el Artesano habla de su oficio: una sola frase, sin nombres ni fotos (Quienes somos sigue fuera del alcance)
export function Manifiesto() {
  return (
    <section aria-labelledby="manifiesto-titulo" className="bg-superficie-calida px-4 py-24">
      <div className="w-full max-w-contenedor mx-auto flex flex-col gap-4">
        <p className="text-sm font-medium uppercase text-texto-secundario">Nuestro taller</p>
        <h2 id="manifiesto-titulo" className="text-h1 max-w-prosa text-texto-principal">
          Cortamos y grabamos cada pieza en nuestro taller, en Neiva.
        </h2>
      </div>
    </section>
  )
}
