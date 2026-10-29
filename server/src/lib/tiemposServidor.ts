import type { Server } from 'node:http'

/**
 * Pone tiempos de espera al servidor HTTP para que una subida a gotas no ocupe un cupo indefinidamente.
 * [DECISION] 20 s para las cabeceras y 120 s para la peticion completa - tres fotos ya reducidas (menos de 1 MB cada una)
 * suben en segundos incluso con datos moviles lentos; el margen cubre una conexion mala sin dejar la puerta abierta.
 * Node exige headersTimeout <= requestTimeout.
 * @param server - Servidor devuelto por app.listen.
 */
export function aplicarTiemposServidor(server: Server): void {
  server.headersTimeout = 20_000
  server.requestTimeout = 120_000
}
