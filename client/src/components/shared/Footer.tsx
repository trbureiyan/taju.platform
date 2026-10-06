import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { NUMERO_WHATSAPP_LEGIBLE } from '../../lib/whatsapp'
import { RESPONSABLE } from '../../lib/politicaDatos'
import { enlaceComoLlegar, urlMapaIncrustado } from '../../lib/ubicacion'

const CLASE_ENLACE =
  'inline-flex items-center min-h-boton text-sm text-texto-invertido underline-offset-4 hover:underline'

// pie legal del sitio: identidad §1 pide la razon social aqui, por eso vive en Layout y no en la Vitrina
export function Footer() {
  const { autenticado, usuario } = useAuth()

  return (
    <footer className="bg-superficie-invertida text-texto-invertido">
      <div className="w-full max-w-contenedor mx-auto px-4 py-12 flex flex-col gap-8 md:flex-row md:justify-between">
        <div className="flex items-center gap-4">
          {/* el monocromatico viene en trazo oscuro: sobre tinta se invierte a blanco. 48px, por encima del minimo de 24 */}
          <img src="/brand/taju-isotipo-monocromático.svg" alt="" className="w-12 h-12 brightness-0 invert" />
          <p className="font-semibold">TaJú · Papelería Creativa</p>
        </div>

        <nav aria-label="Pie de página" className="flex flex-col gap-1">
          <Link to="/catalogo" className={CLASE_ENLACE}>
            Catálogo
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
          {/* sin logo: Lucide no trae iconos de marca y no se mezclan sets */}
          <a href="https://www.instagram.com/taju_neiva" target="_blank" rel="noopener noreferrer" className={CLASE_ENLACE}>
            Instagram @taju_neiva
          </a>
          <p className="text-sm cifra">WhatsApp {NUMERO_WHATSAPP_LEGIBLE}</p>
        </nav>
      </div>
      <section aria-labelledby="titulo-ubicacion" className="w-full max-w-contenedor mx-auto px-4 pb-12 flex flex-col gap-3">
        <h2 id="titulo-ubicacion" className="font-semibold">
          Dónde estamos
        </h2>
        <p className="text-sm">{RESPONSABLE.direccion}</p>
        {/* [DECISION] mapa incrustado de Google con carga diferida: no hay dependencia que instalar ni llave de API.
            Costo: al cargarlo Google recibe la IP de la visita y puede guardar cookies; por eso /datos lo nombra
            como proveedor y, si se agrega analítica o cookies propias, hay que revisarlo junto con el resto. */}
        <iframe
          title="Mapa con la ubicación de TaJú"
          src={urlMapaIncrustado()}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="w-full max-w-md aspect-video rounded-tarjeta border-2 border-borde-medio"
        />
        <a href={enlaceComoLlegar()} target="_blank" rel="noopener noreferrer" className={CLASE_ENLACE}>
          Cómo llegar
        </a>
        <Link to="/datos" className={CLASE_ENLACE}>
          Cómo tratamos tus datos
        </Link>
      </section>
      <p className="w-full max-w-contenedor mx-auto px-4 pb-8 text-xs cifra">
        Tajú Neiva · Neiva, Huila · {new Date().getFullYear()}
      </p>
    </footer>
  )
}
