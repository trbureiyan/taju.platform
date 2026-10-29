import { describe, it, expect, afterEach } from 'vitest'
import express from 'express'
import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import type { Response } from 'express'
import { limitarSubidasEnCurso } from './limitarSubidasEnCurso.js'

let server: Server
const colgadas: Response[] = []

// servidor real y no supertest: hacen falta peticiones que sigan abiertas mientras llegan otras
async function levantar(opciones?: Parameters<typeof limitarSubidasEnCurso>[0]): Promise<string> {
  const app = express()
  app.use(limitarSubidasEnCurso(opciones))
  app.get('/lento', (_req, res) => {
    colgadas.push(res)
  })
  app.get('/rapido', (_req, res) => {
    res.status(200).json({ ok: true })
  })
  server = app.listen(0)
  await new Promise<void>((resolve) => server.once('listening', resolve))
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`
}

async function esperarHasta(condicion: () => boolean | Promise<boolean>): Promise<void> {
  for (let i = 0; i < 100; i += 1) {
    if (await condicion()) return
    await new Promise((resolve) => setTimeout(resolve, 20))
  }
  throw new Error('la condicion no se cumplio a tiempo')
}

afterEach(async () => {
  colgadas.splice(0).forEach((res) => res.end())
  server.closeAllConnections()
  await new Promise<void>((resolve) => server.close(() => resolve()))
})

describe('limitarSubidasEnCurso', () => {
  it('deja pasar hasta max peticiones simultáneas y responde 503 a la siguiente', async () => {
    const base = await levantar({ max: 2, skip: () => false })
    void fetch(`${base}/lento`).catch(() => undefined)
    void fetch(`${base}/lento`).catch(() => undefined)
    await esperarHasta(() => colgadas.length === 2)

    const tercera = await fetch(`${base}/rapido`)

    expect(tercera.status).toBe(503)
    expect(tercera.headers.get('retry-after')).toBe('60')
    expect(await tercera.json()).toEqual({ error: 'El taller está recibiendo muchas fotos a la vez. Intenta de nuevo en un minuto.' })
  })

  it('libera el cupo cuando la respuesta termina', async () => {
    const base = await levantar({ max: 1, skip: () => false })
    const primera = fetch(`${base}/lento`)
    await esperarHasta(() => colgadas.length === 1)

    colgadas[0].end()
    await primera

    await esperarHasta(async () => (await fetch(`${base}/rapido`)).status === 200)
  })

  it('libera el cupo cuando el cliente corta la conexión', async () => {
    const base = await levantar({ max: 1, skip: () => false })
    const corte = new AbortController()
    void fetch(`${base}/lento`, { signal: corte.signal }).catch(() => undefined)
    await esperarHasta(() => colgadas.length === 1)

    corte.abort()

    await esperarHasta(async () => (await fetch(`${base}/rapido`)).status === 200)
  })

  it('por defecto se salta en NODE_ENV test, como el limitador de pedidos', async () => {
    const base = await levantar({ max: 1 })
    void fetch(`${base}/lento`).catch(() => undefined)
    void fetch(`${base}/lento`).catch(() => undefined)
    await esperarHasta(() => colgadas.length === 2)

    expect((await fetch(`${base}/rapido`)).status).toBe(200)
  })
})
