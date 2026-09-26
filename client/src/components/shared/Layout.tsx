import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Nav } from './Nav'
import { Footer } from './Footer'
import { BotonWhatsApp } from './BotonWhatsApp'
import { useDespertarServidor } from '../../hooks/useDespertarServidor'

// canal complementario en toda la app - nunca sustituye el registro de pedido en la plataforma (ver BotonWhatsApp)
const MENSAJE_CONSULTA_GENERAL = 'Hola, tengo una consulta sobre TaJú.'

/**
 * Envuelve el contenido de la app con el Nav, el contenedor principal y el pie de página.
 * @prop children - Contenido de la página activa.
 */
export function Layout({ children }: { children: ReactNode }) {
  // aqui y no en la Vitrina: quien entra directo a /catalogo (enlace, recarga) tambien despierta al servidor
  useDespertarServidor()

  const { pathname } = useLocation()
  // panel de Taller: legibilidad operativa sin decoracion (ver AGENTS.md) - ni CTA de WhatsApp ni pie de marca
  const esPanelTaller = pathname.startsWith('/admin')
  // [DECISION] la Vitrina es la unica pagina a sangre, las demas conservan el contenedor - Layout ya decide por
  // ruta para el admin. Si otra pagina necesita bandas a sangre, pasar a que cada pagina elija su contenedor.
  const esVitrina = pathname === '/'

  return (
    <div className="min-h-screen bg-superficie-base flex flex-col">
      <Nav />
      <main className={esVitrina ? 'flex-1 w-full' : 'flex-1 w-full max-w-contenedor mx-auto px-4 py-8'}>
        {children}
      </main>
      {!esPanelTaller && <Footer />}
      {!esPanelTaller && <BotonWhatsApp variante="flotante" mensaje={MENSAJE_CONSULTA_GENERAL} />}
    </div>
  )
}
