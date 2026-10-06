import { describe, it, expect } from 'vitest'
import { marcadoresPendientes, TEXTOS_POLITICA, VERSION_POLITICA_DATOS } from './politicaDatos'

// el cliente no incluye @types/node; solo se lee una variable de entorno de CI
declare const process: { env: Record<string, string | undefined> }

describe('politicaDatos', () => {
  it('tiene versión y secciones', () => {
    expect(VERSION_POLITICA_DATOS).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(TEXTOS_POLITICA.length).toBeGreaterThan(3)
  })

  it('el detector encuentra los marcadores mientras existan (siempre corre)', () => {
    // mientras el texto sea borrador, hay pendientes; esta prueba no es la compuerta, solo prueba el detector
    const conMarcador = marcadoresPendientes(['NIT: [PENDIENTE]', 'listo'])
    expect(conMarcador).toEqual(['NIT: [PENDIENTE]'])
    expect(marcadoresPendientes(['todo confirmado'])).toEqual([])
  })

  // COMPUERTA: solo corre en PR a main (GitHub Actions define GITHUB_BASE_REF). Pasa a verde cuando Juan Camilo o el
  // abogado confirmen los datos del responsable y el texto. En local: GITHUB_BASE_REF=main pnpm --filter taju-client test
  it.runIf(process.env.GITHUB_BASE_REF === 'main')('no llega a producción con marcadores [PENDIENTE]', () => {
    expect(marcadoresPendientes()).toEqual([])
  })
})
