import type { ReactNode } from 'react'
import type { EstadoPedido } from '../../types'

interface BadgeProps {
  children: ReactNode
  variante?: 'neutro' | 'exito' | 'aviso' | 'error' | 'info'
  className?: string
}

// variantes de sistema (info/exito/aviso/error), no confundir con los colores de marca
const estilos: Record<NonNullable<BadgeProps['variante']>, string> = {
  neutro: 'bg-superficie-elevada text-texto-secundario border-borde-defecto',
  exito: 'bg-exito-fondo text-exito-texto border-exito-borde',
  aviso: 'bg-aviso-fondo text-aviso-texto border-aviso-borde',
  error: 'bg-error-fondo text-error-texto border-error-borde',
  info: 'bg-info-fondo text-info-texto border-info-borde',
}

export function Badge({ children, variante = 'neutro', className = '' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        estilos[variante],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </span>
  )
}

// mapea el estado del pedido a un color de sistema, la etiqueta en texto la sigue mandando el llamador
const VARIANTE_POR_ESTADO: Record<EstadoPedido, BadgeProps['variante']> = {
  pendiente: 'info',
  en_produccion: 'aviso',
  listo: 'exito',
  entregado: 'neutro',
}

// [!] sin uso todavia: MisPedidosPage/AdminPedidosPage/AdminCalendarioPage repiten CLASES_ESTADO
// a mano en vez de este componente - reemplazarlos por BadgeEstado seria la consolidacion natural
export function BadgeEstado({ estado, etiqueta }: { estado: EstadoPedido; etiqueta: string }) {
  return <Badge variante={VARIANTE_POR_ESTADO[estado]}>{etiqueta}</Badge>
}
