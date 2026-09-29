import { describe, it, expect } from 'vitest'
import express from 'express'
import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { crearLimitePedidos } from './limitePedidos.js'

async function conApp(max: number, fn: (url: string) => Promise<void>) {
  const app = express()
  app.post('/x', crearLimitePedidos({ max, skip: () => false }), (_req, res) => { res.json({ ok: true }) })
  const server: Server = app.listen(0)
  await new Promise<void>((resolve) => server.once('listening', resolve))
  try {
    await fn(`http://127.0.0.1:${(server.address() as AddressInfo).port}`)
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()))
  }
}

describe('limitePedidos', () => {
  it('deja pasar hasta el maximo y responde 429 con mensaje propio al pasarse', async () => {
    await conApp(2, async (url) => {
      expect((await fetch(`${url}/x`, { method: 'POST' })).status).toBe(200)
      expect((await fetch(`${url}/x`, { method: 'POST' })).status).toBe(200)
      const res = await fetch(`${url}/x`, { method: 'POST' })
      expect(res.status).toBe(429)
      const cuerpo = (await res.json()) as { error: string }
      expect(cuerpo.error).toMatch(/muchas solicitudes/i)
    })
  })

  it('por defecto se salta en el entorno de test para no contaminar otros tests', async () => {
    const app = express()
    app.post('/x', crearLimitePedidos({ max: 1 }), (_req, res) => { res.json({ ok: true }) })
    const server: Server = app.listen(0)
    await new Promise<void>((resolve) => server.once('listening', resolve))
    try {
      const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
      expect((await fetch(`${url}/x`, { method: 'POST' })).status).toBe(200)
      expect((await fetch(`${url}/x`, { method: 'POST' })).status).toBe(200)
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()))
    }
  })
})
