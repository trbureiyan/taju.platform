import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BloqueEntrega } from './BloqueEntrega'

const recoger = { metodo: 'recoger', detalle: '' } as const

describe('BloqueEntrega', () => {
  it('con fecha acordada la muestra con su hora y no repite lo que el cliente pidio', () => {
    render(
      <BloqueEntrega
        estado="recibido"
        fechaDeseada="2026-10-16T22:00:00.000Z"
        fechaEntrega="2026-10-18T22:00:00.000Z"
        entrega={recoger}
      />,
    )
    expect(screen.getByText(/fecha acordada: .*18 de octubre.*5:00/i)).toBeInTheDocument()
    expect(screen.queryByText(/fecha que pediste/i)).not.toBeInTheDocument()
  })

  it('sin fecha acordada muestra la que pidio y dice que se acuerda por WhatsApp', () => {
    render(<BloqueEntrega estado="recibido" fechaDeseada="2026-10-16T22:00:00.000Z" fechaEntrega={null} entrega={recoger} />)
    expect(screen.getByText(/fecha que pediste: .*16 de octubre/i)).toBeInTheDocument()
    expect(screen.getByText(/la acordamos contigo por whatsapp antes de confirmar/i)).toBeInTheDocument()
  })

  it('dice como recibe el pedido: taller o domicilio con su direccion', () => {
    const { rerender } = render(<BloqueEntrega estado="recibido" fechaDeseada={null} fechaEntrega={null} entrega={recoger} />)
    expect(screen.getByText('La recoges en el taller')).toBeInTheDocument()

    rerender(
      <BloqueEntrega
        estado="recibido"
        fechaDeseada={null}
        fechaEntrega={null}
        entrega={{ metodo: 'domicilio', detalle: 'Cra 5 # 10-20' }}
      />,
    )
    expect(screen.getByText('A domicilio: Cra 5 # 10-20')).toBeInTheDocument()
  })

  it('un pedido cancelado no muestra fechas ni promete acordarlas', () => {
    render(
      <BloqueEntrega
        estado="cancelado"
        fechaDeseada="2026-10-16T22:00:00.000Z"
        fechaEntrega="2026-10-18T22:00:00.000Z"
        entrega={recoger}
      />,
    )
    expect(screen.queryByText(/fecha acordada/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/fecha que pediste/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/la acordamos contigo/i)).not.toBeInTheDocument()
  })
})
