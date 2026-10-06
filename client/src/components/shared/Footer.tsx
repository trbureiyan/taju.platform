import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { RESPONSABLE } from '../../lib/politicaDatos'
import { enlaceComoLlegar, urlMapaIncrustado } from '../../lib/ubicacion'
import { enlaceWhatsApp } from '../../lib/whatsapp'

const CLASE_ENLACE =
  'inline-flex items-center min-h-boton text-sm text-texto-invertido underline-offset-4 hover:underline focus-visible:outline-none focus-visible:shadow-foco'
const CLASE_TITULO = 'text-sm font-semibold uppercase tracking-wide text-texto-invertido'

const INSTAGRAM = 'https://www.instagram.com/taju_neiva'
const FACEBOOK = 'https://www.facebook.com/profile.php?id=100092397487584'

// pie legal del sitio: identidad §1 pide la razon social aqui, por eso vive en Layout y no en la Vitrina.
// [DECISION] cuatro bloques con titulo en lugar de una fila de enlaces sueltos: en movil se apilan y quien busca "como
// llegar" o "escribir" lo encuentra sin leer todo. Las redes van como texto: Lucide no trae iconos de marca.
export function Footer() {
  const { autenticado, usuario } = useAuth()

  return (
    <footer className="bg-superficie-invertida text-texto-invertido">
      <div className="mx-auto grid w-full max-w-contenedor gap-8 px-4 py-12 md:grid-cols-2 lg:grid-cols-4">
        <section aria-labelledby="pie-marca" className="flex min-w-0 flex-col gap-3">
          <div className="flex items-center gap-4">
            {/* el monocromatico viene en trazo oscuro: sobre tinta se invierte a blanco. 48px, por encima del minimo de 24 */}
            <img src="/brand/taju-isotipo-monocromático.svg" alt="" className="h-12 w-12 brightness-0 invert" />
            <h2 id="pie-marca" className="font-semibold">
              TaJú · Papelería Creativa
            </h2>
          </div>
          <p className="text-sm">
            Papelería creativa personalizada en Neiva: cake toppers, banners, letras en vinilo y más, hechos a tu medida.
          </p>
        </section>

        <nav aria-label="Pie de página" className="flex min-w-0 flex-col gap-1">
          <h2 className={CLASE_TITULO}>
            Navegar
          </h2>
          <Link to="/catalogo" className={CLASE_ENLACE}>
            Catálogo
          </Link>
          <Link to="/preguntas-frecuentes" className={CLASE_ENLACE}>
            Preguntas frecuentes
          </Link>
          {autenticado && usuario?.rol === 'cliente' ? (
            <Link to="/mis-pedidos" className={CLASE_ENLACE}>
              Mis pedidos
            </Link>
          ) : (
            !autenticado && (
              <Link to="/login" className={CLASE_ENLACE}>
                Ingresar
              </Link>
            )
          )}
        </nav>

        <section aria-labelledby="pie-contacto" className="flex min-w-0 flex-col gap-1">
          <h2 id="pie-contacto" className={CLASE_TITULO}>
            Contacto
          </h2>
          <a
            href={enlaceWhatsApp('Hola TaJú, quisiera hacerles una consulta.')}
            target="_blank"
            rel="noopener noreferrer"
            className={`${CLASE_ENLACE} cifra`}
          >
            WhatsApp {RESPONSABLE.telefono}
          </a>
          <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer" className={CLASE_ENLACE}>
            Instagram @taju_neiva
          </a>
          <a href={FACEBOOK} target="_blank" rel="noopener noreferrer" className={CLASE_ENLACE}>
            Facebook TaJú Estudio Creativo
          </a>
          <a href={`mailto:${RESPONSABLE.correo}`} className={`${CLASE_ENLACE} break-all`}>
            {RESPONSABLE.correo}
          </a>
        </section>

        <section aria-labelledby="titulo-ubicacion" className="flex min-w-0 flex-col gap-3">
          <h2 id="titulo-ubicacion" className={CLASE_TITULO}>
            Dónde estamos
          </h2>
          <p className="text-sm">{RESPONSABLE.direccion}</p>
          {/* [DECISION] mapa incrustado de Google con carga diferida: no hay dependencia que instalar ni llave de API.
              Costo: al cargarlo Google recibe la IP de la visita y puede guardar cookies; por eso /datos lo nombra
              como proveedor y, si se agrega analitica o cookies propias, hay que revisarlo junto con el resto. */}
          <iframe
            title="Mapa con la ubicación de TaJú"
            src={urlMapaIncrustado()}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="aspect-video w-full rounded-tarjeta border-2 border-borde-medio"
          />
          <a href={enlaceComoLlegar()} target="_blank" rel="noopener noreferrer" className={CLASE_ENLACE}>
            Cómo llegar
          </a>
        </section>
      </div>

      <div className="border-t border-borde-medio">
        <div className="mx-auto flex w-full max-w-contenedor flex-col gap-1 px-4 py-4 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p className="cifra">Tajú Neiva · Neiva, Huila · {new Date().getFullYear()}</p>
          <Link to="/datos" className={CLASE_ENLACE}>
            Cómo tratamos tus datos
          </Link>
        </div>
      </div>
    </footer>
  )
}
