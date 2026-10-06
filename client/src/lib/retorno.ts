export type MotivoDeAcceso = 'pedido' | 'mis-pedidos' | null

/**
 * Acepta solo rutas internas de la app. Un `?redirect=` llega de la URL, que cualquiera puede escribir.
 * @returns La misma ruta, o null si no empieza con "/", empieza con "//" o "/\", o trae caracteres de control.
 */
export function rutaDeRetorno(valor: string | null | undefined): string | null {
  if (!valor || !valor.startsWith('/')) return null
  if (valor.startsWith('//') || valor.startsWith('/\\')) return null
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(valor)) return null
  // volver a las propias pantallas de acceso dejaría a la persona dando vueltas (o el botón de registro en espera)
  if (/^\/(?:login|registrar|datos)(?:[?#]|$)/.test(valor)) return null
  return valor
}

/** Ruta de acceso con el destino de origen. Las barras quedan sin codificar para que la URL se lea. */
export function conRetorno(ruta: '/login' | '/registrar', destino: string | null | undefined): string {
  const limpio = rutaDeRetorno(destino)
  return limpio ? `${ruta}?redirect=${encodeURIComponent(limpio).replace(/%2F/g, '/')}` : ruta
}

/** Por qué se pide la cuenta, según el destino al que la persona quería llegar. */
export function motivoDeRetorno(destino: string | null | undefined): MotivoDeAcceso {
  const ruta = rutaDeRetorno(destino)
  if (!ruta) return null
  if (ruta === '/pedido' || ruta.startsWith('/pedido/')) return 'pedido'
  if (ruta === '/mis-pedidos' || ruta.startsWith('/mis-pedidos/')) return 'mis-pedidos'
  return null
}
