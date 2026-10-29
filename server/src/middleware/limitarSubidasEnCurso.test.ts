import { describe, it, expect, afterEach } from 'vitest'
import express from 'express'
import http from 'node:http'
import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import type { Response } from 'express'
import { limitarSubidasEnCurso } from './limitarSubidasEnCurso.js'

let server: Server
const colgadas: Response[] = []

// servidor real y no supertest: hacen falta peticiones que sigan abiertas mientras llegan otras
async function levantar(opciones?: Parameters<typeof limitarSubidasEnCurso>[0]): Promise<string> {
  const app = express()
  // sustituye a requireAuth: la identidad llega en una cabecera de prueba
  app.use((req, _res, next) => {
    const usuario = req.headers['x-usuario']
    if (typeof usuario === 'string') req.usuario = { sub: usuario, email: `${usuario}@taju.test`, rol: 'cliente' }
    next()
  })
  app.use(limitarSubidasEnCurso(opciones))
  app.post('/subir', (_req, res) => {
    colgadas.push(res)
  })
  // lee el cuerpo como lo hace multer: sin esto el socket se pausa por contrapresion y bytesRead deja de moverse
  app.post('/consumir', (req, res) => {
    req.resume()
    colgadas.push(res)
  })
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

  it('una misma cuenta no puede ocupar más de maxPorUsuario cupos: la segunda recibe 429 y otra cuenta sigue pasando', async () => {
    const base = await levantar({ max: 4, maxPorUsuario: 1, skip: () => false })
    void fetch(`${base}/lento`, { headers: { 'x-usuario': 'ana' } }).catch(() => undefined)
    await esperarHasta(() => colgadas.length === 1)

    const repetida = await fetch(`${base}/rapido`, { headers: { 'x-usuario': 'ana' } })
    const otra = await fetch(`${base}/rapido`, { headers: { 'x-usuario': 'beto' } })

    expect(repetida.status).toBe(429)
    expect(repetida.headers.get('retry-after')).toBe('10')
    expect(((await repetida.json()) as { error: string }).error).toBe('Ya estamos recibiendo las fotos de tu pedido. Espera unos segundos antes de volver a enviarlo.')
    expect(otra.status).toBe(200)
  })

  it('libera el cupo de la cuenta cuando su petición termina', async () => {
    const base = await levantar({ max: 4, maxPorUsuario: 1, skip: () => false })
    const primera = fetch(`${base}/lento`, { headers: { 'x-usuario': 'ana' } })
    await esperarHasta(() => colgadas.length === 1)

    colgadas[0].end()
    await primera

    await esperarHasta(async () => (await fetch(`${base}/rapido`, { headers: { 'x-usuario': 'ana' } })).status === 200)
  })

  it('corta una subida que deja de enviar bytes y libera su cupo', async () => {
    const base = await levantar({ max: 1, inactividadMs: 100, skip: () => false })
    const { port } = new URL(base)

    // declara 1 MB, manda un byte y se queda callado: sin corte por inactividad ocuparia el cupo hasta el timeout total
    const cortada = await new Promise<string>((resolve) => {
      const req = http.request({ port, method: 'POST', path: '/subir', headers: { 'content-length': '1048576' } })
      req.on('error', (err) => resolve(err.message))
      req.on('response', () => resolve('respuesta'))
      req.write('x')
    })

    expect(cortada).toMatch(/socket hang up|ECONNRESET|respuesta/)
    await esperarHasta(async () => (await fetch(`${base}/rapido`)).status === 200)
  })

  // manda el cuerpo por goteo y devuelve si el servidor corto la conexion antes de `limiteMs`
  function gotear(
    port: string,
    { bytes, cada, limiteMs, ruta = '/subir' }: { bytes: number; cada: number; limiteMs: number; ruta?: string },
  ): Promise<'cortada' | 'sigue'> {
    return new Promise((resolve) => {
      const req = http.request({ port, method: 'POST', path: ruta, headers: { 'content-length': '104857600' } })
      const goteo = setInterval(() => req.write(Buffer.alloc(bytes, 1)), cada)
      const terminar = (resultado: 'cortada' | 'sigue') => {
        clearInterval(goteo)
        clearTimeout(limite)
        req.destroy()
        resolve(resultado)
      }
      const limite = setTimeout(() => terminar('sigue'), limiteMs)
      req.on('error', () => terminar('cortada'))
      req.on('response', () => terminar('cortada'))
      req.on('close', () => terminar('cortada'))
    })
  }

  it('corta una subida a gotas: un byte cada tanto mueve bytesRead pero no llega al mínimo de ancho de banda', async () => {
    const base = await levantar({ max: 1, inactividadMs: 200, minBytesPorRevision: 1000, skip: () => false })

    const resultado = await gotear(new URL(base).port, { bytes: 1, cada: 30, limiteMs: 2000 })

    expect(resultado).toBe('cortada')
    await esperarHasta(async () => (await fetch(`${base}/rapido`)).status === 200)
  })

  it('corta una subida que sí avanza pero pasa del plazo máximo de la subida', async () => {
    const base = await levantar({ max: 1, inactividadMs: 100, minBytesPorRevision: 1, plazoSubidaMs: 400, skip: () => false })

    const resultado = await gotear(new URL(base).port, { bytes: 20_000, cada: 20, limiteMs: 3000, ruta: '/consumir' })

    expect(resultado).toBe('cortada')
  })

  it('no corta una subida completa aunque el controlador tarde más que el plazo (ya no se está recibiendo nada)', async () => {
    const base = await levantar({ max: 1, inactividadMs: 100, plazoSubidaMs: 200, skip: () => false })
    const { port } = new URL(base)

    const respuesta = new Promise<number>((resolve, reject) => {
      const req = http.request({ port, method: 'POST', path: '/subir', headers: { 'content-length': '1' } }, (res) => resolve(res.statusCode ?? 0))
      req.on('error', reject)
      req.end('x')
    })
    await esperarHasta(() => colgadas.length === 1)
    await new Promise((resolve) => setTimeout(resolve, 500))
    colgadas[0].end()

    expect(await respuesta).toBe(200)
  })

  it('por defecto se salta en NODE_ENV test, como el limitador de pedidos', async () => {
    const base = await levantar({ max: 1 })
    void fetch(`${base}/lento`).catch(() => undefined)
    void fetch(`${base}/lento`).catch(() => undefined)
    await esperarHasta(() => colgadas.length === 2)

    expect((await fetch(`${base}/rapido`)).status).toBe(200)
  })
})
