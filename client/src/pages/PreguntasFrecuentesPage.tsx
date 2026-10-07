import { ChevronDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { GRUPOS_FAQ } from '../components/faq/contenido'
import { enlaceWhatsApp } from '../lib/whatsapp'

/**
 * Preguntas frecuentes. El texto vive en `components/faq/contenido.ts`; aquí solo se pinta.
 * Cada pregunta es un `<details>` nativo: abre con teclado y lector de pantalla sin JavaScript propio.
 */
export function PreguntasFrecuentesPage() {
  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-8 py-6 lg:py-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-h1 font-semibold text-texto-principal">Preguntas frecuentes</h1>
        <p className="text-base text-texto-secundario">
          Lo que más nos preguntan antes de pedir. Si no encuentras lo tuyo, escríbenos y te respondemos.
        </p>
      </header>

      {GRUPOS_FAQ.map((grupo) => (
        <section key={grupo.titulo} className="flex flex-col gap-3">
          <h2 className="text-h3 font-semibold text-texto-principal">{grupo.titulo}</h2>
          <div className="flex flex-col gap-2">
            {grupo.preguntas.map((p) => (
              <details
                key={p.id}
                className="group rounded-tarjeta border-2 border-dashed border-borde-medio bg-superficie-calida px-4"
              >
                <summary className="flex min-h-boton cursor-pointer list-none items-center justify-between gap-3 py-2 text-base font-medium text-texto-principal outline-none focus-visible:shadow-foco [&::-webkit-details-marker]:hidden">
                  <span>{p.pregunta}</span>
                  <ChevronDown
                    aria-hidden="true"
                    size={20}
                    className="shrink-0 transition-transform duration-normal ease-estandar group-open:rotate-180"
                  />
                </summary>
                <div className="flex flex-col gap-2 pb-4 text-base text-texto-principal">
                  {p.respuesta.map((parrafo) => (
                    <p key={parrafo} className="break-words">
                      {parrafo}
                    </p>
                  ))}
                  {p.enlace && (
                    <Link
                      to={p.enlace.a}
                      className="inline-flex min-h-boton items-center text-sm font-medium text-texto-principal underline underline-offset-4"
                    >
                      {p.enlace.texto}
                    </Link>
                  )}
                </div>
              </details>
            ))}
          </div>
        </section>
      ))}

      <p className="text-base text-texto-secundario">
        ¿Te quedó una duda?{' '}
        <a
          href={enlaceWhatsApp('Hola TaJú, tengo una duda antes de pedir.')}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-boton items-center font-medium text-texto-principal underline underline-offset-4"
        >
          Escríbenos por WhatsApp
        </a>
      </p>
    </article>
  )
}
