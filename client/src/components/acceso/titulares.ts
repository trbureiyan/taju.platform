import type { MotivoDeAcceso } from '../../lib/retorno'

type Modo = 'registro' | 'ingreso'

const TEXTOS: Record<Modo, Record<'pedido' | 'mis-pedidos' | 'general', { titulo: string; apoyo: string }>> = {
  registro: {
    pedido: {
      titulo: 'Antes de enviar tu solicitud, crea tu cuenta',
      apoyo: 'Necesitamos saber quién eres para escribirte y para que puedas seguir tu solicitud.',
    },
    'mis-pedidos': {
      titulo: 'Crea tu cuenta para ver tus pedidos',
      apoyo: 'Aquí quedan todas tus solicitudes, con su estado.',
    },
    general: {
      titulo: 'Crea tu cuenta de TaJú',
      apoyo: 'Con ella envías solicitudes y sigues cada pedido desde un solo lugar.',
    },
  },
  ingreso: {
    pedido: {
      titulo: 'Ingresa para enviar tu solicitud',
      apoyo: 'Con tu cuenta te escribimos y puedes seguir tu solicitud.',
    },
    'mis-pedidos': { titulo: 'Ingresa para ver tus pedidos', apoyo: 'Tus solicitudes y su estado, en un solo lugar.' },
    general: { titulo: 'Ingresa a tu cuenta', apoyo: 'Aquí sigues tus pedidos y envías nuevas solicitudes.' },
  },
}

/** Titular y apoyo de la vista de acceso. El motivo sale del destino al que la persona quería llegar. */
export function titularDeAcceso(modo: Modo, motivo: MotivoDeAcceso): { titulo: string; apoyo: string } {
  return TEXTOS[modo][motivo ?? 'general']
}
