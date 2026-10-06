import { Link } from 'react-router-dom'
import { TEXTOS_POLITICA, VERSION_POLITICA_DATOS } from '../lib/politicaDatos'

// renderiza el texto de la lib tal cual, marcadores [PENDIENTE] incluidos: ocultarlos escondería datos que faltan
export function DatosPage() {
  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-6 py-6 lg:py-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-h1 font-semibold text-texto-principal">Cómo tratamos tus datos</h1>
        <p className="text-sm text-texto-secundario">Versión {VERSION_POLITICA_DATOS}</p>
      </header>
      {TEXTOS_POLITICA.map((s) => (
        <section key={s.titulo} className="flex flex-col gap-2">
          <h2 className="text-h3 font-semibold text-texto-principal">{s.titulo}</h2>
          {s.parrafos.map((p) => (
            <p key={p} className="break-words text-base text-texto-principal">{p}</p>
          ))}
        </section>
      ))}
      <Link to="/registrar" className="text-sm font-medium text-texto-principal hover:underline">
        Volver al registro
      </Link>
    </article>
  )
}
