import { MessageCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { enlaceWhatsApp } from '../../lib/whatsapp'

type Variante = 'flotante' | 'linea'

/**
 * Props del botón de handoff a WhatsApp.
 * @prop mensaje - Texto a prellenar en el chat.
 * @prop variante - 'flotante' (fijo, ícono, persistente en toda la app) o 'linea' (botón en flujo normal).
 * @prop children - Texto del botón. Solo se usa en variante 'linea'; 'flotante' es ícono puro con aria-label.
 */
interface BotonWhatsAppProps {
  mensaje: string
  variante?: Variante
  children?: ReactNode
}

// canal complementario para dudas puntuales, nunca sustituto del registro de pedido en la plataforma -
// por eso usa accion-sec (apoyo) y no accion (la unica primaria de la pantalla es "Enviar mi pedido")
export function BotonWhatsApp({ mensaje, variante = 'linea', children }: BotonWhatsAppProps) {
  const href = enlaceWhatsApp(mensaje)

  if (variante === 'flotante') {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Escríbenos por WhatsApp"
        className={[
          'fixed bottom-6 right-6 z-elevado block w-16 h-16 rounded-full',
          'transition-transform duration-normal ease-estandar hover:-translate-y-0.5 active:scale-97',
          'focus-visible:outline-none focus-visible:shadow-foco',
        ].join(' ')}
      >
        {/* [DECISION] logo oficial de WhatsApp como imagen estática en public/terceros, no como componente: lleva sus
            colores de marca (verde y blanco) y las reglas del sistema prohíben hexadecimales en componentes. Lucide no
            trae iconos de marca; es la excepción a "un solo set de iconos", solo para este botón. */}
        <img src="/terceros/whatsapp.svg" alt="" className="w-full h-full" />
      </a>
    )
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={[
        'inline-flex items-center justify-center gap-2 rounded-boton font-medium min-h-boton px-boton-x',
        'bg-accion-sec-fondo text-accion-sec-texto border border-accion-sec-borde hover:bg-superficie-elevada',
        'transition-[background-color,transform] duration-normal ease-estandar active:scale-97',
        'focus-visible:outline-none focus-visible:shadow-foco',
      ].join(' ')}
    >
      <MessageCircle aria-hidden="true" size={18} />
      {children}
    </a>
  )
}
