import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { NUMERO_WHATSAPP_LEGIBLE } from '../../lib/whatsapp'

const CLASE_ENLACE =
  'inline-flex items-center min-h-boton text-sm text-texto-invertido underline-offset-4 hover:underline'

// pie legal del sitio: identidad §1 pide la razon social aqui, por eso vive en Layout y no en la Vitrina
export function Footer() {
  const { autenticado, usuario } = useAuth()

  return (
    <footer className="bg-superficie-invertida text-texto-invertido">
      <div className="w-full max-w-contenedor mx-auto px-4 py-12 flex flex-col gap-8 md:flex-row md:justify-between">
        <div className="flex items-center gap-4">
          {/* la variante monocromatica existe para fondos oscuros; 48px, por encima del minimo de 24 */}
          <img src="/brand/taju-isotipo-monocromático.svg" alt="" className="w-12 h-12" />
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
      <p className="w-full max-w-contenedor mx-auto px-4 pb-8 text-xs cifra">
        Tajú Neiva · Neiva, Huila · {new Date().getFullYear()}
      </p>
    </footer>
  )
}
