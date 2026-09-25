import { describe, it, expect, afterEach } from 'vitest'
import request from 'supertest'
import { crearApp } from './app.js'

const ENV_ORIGINAL = { ...process.env }

afterEach(() => {
  process.env = { ...ENV_ORIGINAL }
})

describe('CORS', () => {
  it('en desarrollo acepta cualquier origen', async () => {
    process.env.NODE_ENV = 'development'
    const res = await request(crearApp()).get('/health').set('Origin', 'http://cualquier-cosa.test')
    expect(res.headers['access-control-allow-origin']).toBe('*')
  })

  it('en produccion solo refleja el origen configurado en CLIENT_URL', async () => {
    process.env.NODE_ENV = 'production'
    process.env.CLIENT_URL = 'https://taju.example.com'
    const app = crearApp()

    const permitido = await request(app).get('/health').set('Origin', 'https://taju.example.com')
    expect(permitido.headers['access-control-allow-origin']).toBe('https://taju.example.com')
  })

  // origin string fijo en cors: el header siempre es CLIENT_URL, nunca refleja el Origin del request -
  // el navegador es quien compara y bloquea del lado del cliente si no coinciden
  it('en produccion no refleja un origen distinto a CLIENT_URL', async () => {
    process.env.NODE_ENV = 'production'
    process.env.CLIENT_URL = 'https://taju.example.com'
    const app = crearApp()

    const res = await request(app).get('/health').set('Origin', 'https://otro-sitio.test')
    expect(res.headers['access-control-allow-origin']).toBe('https://taju.example.com')
  })

  // falla al armar la app y no en el primer request real - mismo criterio que secret() en jwt.ts
  it('en produccion sin CLIENT_URL, crearApp lanza al armarse', () => {
    process.env.NODE_ENV = 'production'
    delete process.env.CLIENT_URL
    expect(() => crearApp()).toThrow('CLIENT_URL')
  })
})
