import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Nav } from './Nav'
import { Footer } from './Footer'
import { BotonWhatsApp } from './BotonWhatsApp'
import { ScrollAlInicio } from './ScrollAlInicio'
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
  // [DECISION] Vitrina, catalogo y detalle van a sangre (bandas de color) y ponen su propio contenedor; el resto
  // conserva el de Layout. Si otra pagina necesita bandas, sumarla aqui o pasar a que cada pagina elija.
  const aSangre = pathname === '/' || pathname.startsWith('/catalogo')
  // el detalle trae su WhatsApp con el nombre del producto y una barra fija abajo: el flotante sobraria y la pisaria
  const esDetalle = /^\/catalogo\/[^/]+$/.test(pathname)
  // el formulario tiene una barra fija abajo y su propio enlace de dudas en cada momento: el flotante la pisaria
  const esFormulario = /^\/pedido\/[^/]+$/.test(pathname)

  return (
    <div className="min-h-screen bg-superficie-base flex flex-col">
      <ScrollAlInicio />
      <Nav />
      <main
        className={aSangre ? 'flex-1 w-full' : 'flex-1 w-full max-w-contenedor mx-auto px-4 py-8'}
      >
        {children}
      </main>
      {!esPanelTaller && <Footer />}
      {!esPanelTaller && !esDetalle && !esFormulario && <BotonWhatsApp variante="flotante" mensaje={MENSAJE_CONSULTA_GENERAL} />}
    </div>
  )
}
