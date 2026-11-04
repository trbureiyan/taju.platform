import type { Server } from 'node:http'

/**
 * Pone tiempos de espera al servidor HTTP para que una subida a gotas no ocupe un cupo indefinidamente.
 * [DECISION] 20 s para las cabeceras y 120 s para la peticion completa - tres fotos ya reducidas (menos de 1 MB cada una)
 * suben en segundos incluso con datos moviles lentos; el margen cubre una conexion mala sin dejar la puerta abierta.
 * Node exige headersTimeout <= requestTimeout.
 * [DECISION] revision cada 5 s - Node solo mira estos tiempos cada connectionsCheckingInterval (30 s por defecto), asi que
 * los 20 s de cabeceras cortarian entre 20 y 50 s. Se lee al emitirse 'listening': hay que llamar justo despues de listen().
 * @param server - Servidor devuelto por app.listen.
 */
export function aplicarTiemposServidor(server: Server): void {
  // @types/node lo declara solo como opcion del constructor, pero Node lo lee de la instancia
  ;(server as Server & { connectionsCheckingInterval: number }).connectionsCheckingInterval = 5_000
  server.headersTimeout = 20_000
  server.requestTimeout = 120_000
}
