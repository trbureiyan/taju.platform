import type { ReactNode } from 'react'
import type { EstadoPedido } from '../../types'

/**
 * Props del componente Badge genérico.
 * @prop children - Contenido del badge.
 * @prop variante - Color de sistema; por defecto 'neutro'. No confundir con colores de marca.
 * @prop className - Clases adicionales para casos específicos.
 */
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
        // px-3 py-1: valores de escala base 4 (px-2.5/py-0.5 estaban fuera de la escala permitida)
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium',
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
  recibido: 'neutro',
  en_revision: 'info',
  confirmado: 'info',
  en_produccion: 'aviso',
  listo_para_entrega: 'exito',
  entregado: 'neutro',
}

/**
 * Badge especializado para estados de pedido.
 * @prop estado - Valor canónico del enum EstadoPedido.
 * @prop etiqueta - Texto legible del estado (derivar de ETIQUETAS_ESTADO, no escribir suelto).
 */
// [!] sin uso todavia: MisPedidosPage/AdminPedidosPage/AdminCalendarioPage repiten CLASES_ESTADO
// a mano en vez de este componente - reemplazarlos por BadgeEstado seria la consolidacion natural
export function BadgeEstado({ estado, etiqueta }: { estado: EstadoPedido; etiqueta: string }) {
  return <Badge variante={VARIANTE_POR_ESTADO[estado]}>{etiqueta}</Badge>
}

