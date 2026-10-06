import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PantallaAcceso } from './PantallaAcceso'

describe('PantallaAcceso', () => {
  it('pinta titular, apoyo, constancia y formulario', () => {
    render(
      <PantallaAcceso titulo="Crea tu cuenta de TaJú" apoyo="Con ella envías solicitudes." constancia={<p>la constancia</p>}>
        <form aria-label="registro" />
      </PantallaAcceso>,
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Crea tu cuenta de TaJú' })).toBeInTheDocument()
    expect(screen.getByText('Con ella envías solicitudes.')).toBeInTheDocument()
    expect(screen.getByText('la constancia')).toBeInTheDocument()
    expect(screen.getByRole('form', { name: 'registro' })).toBeInTheDocument()
  })

  it('la constancia va antes que el formulario en el orden del DOM (franja sobre los campos en móvil)', () => {
    render(
      <PantallaAcceso titulo="t" apoyo="a" constancia={<p>constancia</p>}>
        <p>formulario</p>
      </PantallaAcceso>,
    )
    const constancia = screen.getByText('constancia')
    const formulario = screen.getByText('formulario')
    expect(constancia.compareDocumentPosition(formulario) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('la constancia no crea una región complementaria vacía para lectores de pantalla', () => {
    render(
      <PantallaAcceso titulo="t" apoyo="a" constancia={<p aria-hidden="true">c</p>}>
        <p>f</p>
      </PantallaAcceso>,
    )
    expect(screen.queryByRole('complementary')).toBeNull()
  })

  // solo guarda que no se quiten las clases: jsdom no calcula layout, así que el desborde real no se puede probar aquí
  it('las dos columnas pueden encogerse (min-w-0) para que un correo largo no desborde', () => {
    const { container } = render(
      <PantallaAcceso titulo="t" apoyo="a" constancia={<p>c</p>}>
        <p>f</p>
      </PantallaAcceso>,
    )
    expect(container.querySelectorAll('.min-w-0').length).toBeGreaterThanOrEqual(2)
  })
})
