import { describe, it, expect } from 'vitest'
import { marcadoresPendientes, textosDeLaPolitica, RESPONSABLE, TEXTOS_POLITICA, VERSION_POLITICA_DATOS } from './politicaDatos'

// el cliente no incluye @types/node; solo se lee una variable de entorno de CI
declare const process: { env: Record<string, string | undefined> }

describe('politicaDatos', () => {
  it('tiene versión y secciones', () => {
    expect(VERSION_POLITICA_DATOS).toMatch(/^\d{4}-\d{2}-\d{2}(\.\d+)?$/)
    expect(TEXTOS_POLITICA.length).toBeGreaterThan(3)
  })

  it('el detector encuentra los marcadores mientras existan (siempre corre)', () => {
    // mientras el texto sea borrador, hay pendientes; esta prueba no es la compuerta, solo prueba el detector
    const conMarcador = marcadoresPendientes(['Teléfono: [PENDIENTE]', 'listo'])
    expect(conMarcador).toEqual(['Teléfono: [PENDIENTE]'])
    expect(marcadoresPendientes(['todo confirmado'])).toEqual([])
  })

  it.each([
    ['[PENDIENTE] x'], ['[pendiente] x'], ['dato PENDIENTE'], ['[POR CONFIRMAR] x'], ['[confirmar] x'], ['[TODO] x'], ['todo: x'],
  ])('el detector atrapa %j', (t) => expect(marcadoresPendientes([t])).toEqual([t]))

  it('no marca texto limpio', () => {
    expect(marcadoresPendientes(['Tu autorización queda guardada'])).toEqual([])
  })

  it('textosDeLaPolitica incluye responsable, títulos y párrafos', () => {
    const textos = textosDeLaPolitica()
    for (const v of Object.values(RESPONSABLE)) expect(textos).toContain(v)
    for (const s of TEXTOS_POLITICA) {
      expect(textos).toContain(s.titulo)
      for (const p of s.parrafos) expect(textos).toContain(p)
    }
  })

  it('identifica al responsable con nombre, dirección, teléfono y correo, sin pendientes', () => {
    expect(RESPONSABLE.nombre).toContain('Jennifer Tatiana Barrero Bustos')
    expect(RESPONSABLE.nombre).toContain('TaJú Neiva')
    expect(RESPONSABLE.direccion).toContain('Pastrana')
    expect(RESPONSABLE.direccion).toContain('Neiva')
    expect(RESPONSABLE.telefono).toMatch(/^\d{3} \d{3} \d{4}$/)
    expect(RESPONSABLE.correo).toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)
    expect(marcadoresPendientes(Object.values(RESPONSABLE))).toEqual([])
  })

  it('no publica números de documento ni de identificación tributaria', () => {
    expect(Object.keys(RESPONSABLE)).not.toContain('nit')
    expect(textosDeLaPolitica().join(' ')).not.toMatch(/\bNIT\b|cédula|\d{9,}/i)
  })

  it('explica el tratamiento de datos de menores, la vía de queja y los cambios del texto', () => {
    const porTitulo = (t: string) => TEXTOS_POLITICA.find((s) => s.titulo === t)?.parrafos.join(' ') ?? ''
    expect(porTitulo('Datos de menores de edad')).toMatch(/mayor de edad/)
    expect(porTitulo('Datos de menores de edad')).toMatch(/solo para elaborar el pedido/)
    expect(porTitulo('Si no estás conforme')).toContain('Superintendencia de Industria y Comercio')
    expect(porTitulo('Cambios a este texto')).toContain('versión')
  })

  it('no promete plazos propios: los únicos plazos son los que fija la ley', () => {
    const todo = textosDeLaPolitica().join(' ')
    const plazos = todo.match(/\d+\s+días/g) ?? []
    expect(plazos).toEqual(['10 días'])
  })

  it('dice cuánto tiempo se guardan los datos sin prometer un borrado automático que no existe', () => {
    const t = TEXTOS_POLITICA.find((s) => s.titulo === 'Cuánto tiempo guardamos tus datos')?.parrafos.join(' ') ?? ''
    expect(t).toContain('mientras tu cuenta exista')
    expect(t).toContain('no los borramos automáticamente')
    expect(t).toMatch(/escríbenos/i)
    expect(t).toMatch(/por ley|obligación legal|obligaciones legales/)
  })

  it('nombra los proveedores que reciben datos y avisa que pueden estar fuera de Colombia', () => {
    const proveedores = TEXTOS_POLITICA.find((s) => s.titulo === 'Con quién los compartimos')!.parrafos.join(' ')
    for (const nombre of ['MongoDB Atlas', 'Cloudinary', 'Render', 'Vercel', 'WhatsApp', 'Google Maps']) expect(proveedores).toContain(nombre)
    expect(proveedores).toContain('fuera de Colombia')
  })

  it('los textos no remiten a "arriba" ni dicen "cifrada"', () => {
    const todo = textosDeLaPolitica().join(' ')
    expect(todo).toContain('Escríbenos al correo del responsable')
    expect(todo).toContain('guardada de forma que nadie puede leerla')
  })

  // COMPUERTA: solo corre en PR a main (GitHub Actions define GITHUB_BASE_REF). Pasa a verde cuando Juan Camilo o el
  // abogado confirmen los datos del responsable y el texto. En local: GITHUB_BASE_REF=main pnpm --filter taju-client test
  it.runIf(process.env.GITHUB_BASE_REF === 'main')('no llega a producción con marcadores [PENDIENTE]', () => {
    expect(marcadoresPendientes()).toEqual([])
  })
})
