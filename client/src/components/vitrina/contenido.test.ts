import { describe, it, expect } from 'vitest'
import { CONTENIDO_FAMILIAS, rutaFamilia } from './contenido'
import { FAMILIAS, ETIQUETAS_FAMILIA } from '../../types'

describe('contenido de la Vitrina', () => {
  it('cubre las cuatro familias en el orden del enum, con su etiqueta canonica', () => {
    expect(CONTENIDO_FAMILIAS.map((c) => c.familia)).toEqual([...FAMILIAS])
    for (const c of CONTENIDO_FAMILIAS) expect(c.nombre).toBe(ETIQUETAS_FAMILIA[c.familia])
  })

  it.each(FAMILIAS)('rutaFamilia(%s) apunta al catalogo filtrado', (familia) => {
    expect(rutaFamilia(familia)).toBe(`/catalogo?familia=${familia}`)
  })

  it('cada familia dice que datos vamos a pedir antes del formulario', () => {
    for (const c of CONTENIDO_FAMILIAS) expect(c.necesitamos.length).toBeGreaterThan(0)
  })

  it('ningun texto usa voseo ni signos de exclamacion', () => {
    const textos = CONTENIDO_FAMILIAS.flatMap((c) => [c.descripcion, c.cta, ...c.datos, ...c.necesitamos]).join(' ')
    expect(textos).not.toMatch(/[¡!]|\b(querés|podés|tenés|elegí)\b/i)
  })
})
