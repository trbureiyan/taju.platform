import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Nav } from './Nav'
import { BotonWhatsApp } from './BotonWhatsApp'

// canal complementario en toda la app - nunca sustituye el registro de pedido en la plataforma (ver BotonWhatsApp)
const MENSAJE_CONSULTA_GENERAL = 'Hola, tengo una consulta sobre TaJú.'

/**
 * Envuelve el contenido de la app con el Nav y el contenedor principal.
 * @prop children - Contenido de la página activa.
 */
export function Layout({ children }: { children: ReactNode }) {
  // panel de Taller: legibilidad operativa sin decoracion (ver AGENTS.md) - un CTA de WhatsApp orientado
  // al cliente final no tiene lugar en la vista interna del administrador
  const esPanelTaller = useLocation().pathname.startsWith('/admin')

  return (
    <div className="min-h-screen bg-superficie-base flex flex-col">
      <Nav />
      <main className="flex-1 w-full max-w-contenedor mx-auto px-4 py-8">
        {children}
      </main>
      {!esPanelTaller && <BotonWhatsApp variante="flotante" mensaje={MENSAJE_CONSULTA_GENERAL} />}
    </div>
  )
}
