export type MotivoDeAcceso = 'pedido' | 'mis-pedidos' | null

/**
 * Acepta solo rutas internas de la app. Un `?redirect=` llega de la URL, que cualquiera puede escribir.
 * @param valor - Texto crudo del parámetro `redirect`; puede venir vacío o ausente.
 * @returns La misma ruta, o null si no empieza con "/", empieza con "//" o "/\", trae caracteres de control o apunta a
 * las propias pantallas de acceso.
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

/**
 * Ruta de acceso con el destino de origen. Las barras quedan sin codificar para que la URL se lea.
 * @param ruta - Pantalla de acceso a la que se va, `/login` o `/registrar`.
 * @param destino - Ruta a la que la persona quería llegar; si no es una ruta interna válida se omite.
 * @returns La ruta de acceso, con `?redirect=` solo cuando el destino es válido.
 */
export function conRetorno(ruta: '/login' | '/registrar', destino: string | null | undefined): string {
  const limpio = rutaDeRetorno(destino)
  return limpio ? `${ruta}?redirect=${encodeURIComponent(limpio).replace(/%2F/g, '/')}` : ruta
}

/**
 * Por qué se pide la cuenta, según el destino al que la persona quería llegar.
 * @param destino - Ruta de origen (`?redirect=`), con o sin consulta o ancla.
 * @returns 'pedido' o 'mis-pedidos' según la ruta, o null si no hay destino válido o no es una de esas dos.
 */
export function motivoDeRetorno(destino: string | null | undefined): MotivoDeAcceso {
  const ruta = rutaDeRetorno(destino)
  if (!ruta) return null
  // se clasifica por el camino: una consulta o un ancla (`?paso=2`, `#detalle`) no cambia de qué pantalla se trata
  const camino = ruta.split(/[?#]/)[0]
  if (camino === '/pedido' || camino.startsWith('/pedido/')) return 'pedido'
  if (camino === '/mis-pedidos' || camino.startsWith('/mis-pedidos/')) return 'mis-pedidos'
  return null
}
