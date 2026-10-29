import { describe, it, expect } from 'vitest'
import http from 'node:http'
import { aplicarTiemposServidor } from './tiemposServidor.js'

describe('aplicarTiemposServidor', () => {
  it('corta las cabeceras a los 20 s y la petición completa a los 120 s', () => {
    const server = http.createServer()

    aplicarTiemposServidor(server)

    expect(server.headersTimeout).toBe(20_000)
    expect(server.requestTimeout).toBe(120_000)
  })

  it('deja el tiempo de cabeceras por debajo del de la petición, que Node exige', () => {
    const server = http.createServer()

    aplicarTiemposServidor(server)

    expect(server.headersTimeout).toBeLessThanOrEqual(server.requestTimeout)
  })
})
