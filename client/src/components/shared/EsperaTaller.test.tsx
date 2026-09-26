import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { EsperaTaller } from './EsperaTaller'

describe('EsperaTaller', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  const avanzar = (ms: number) => act(() => vi.advanceTimersByTime(ms))

  it('no muestra nada antes de 400 ms', () => {
    render(<EsperaTaller />)
    avanzar(399)
    expect(screen.queryByTestId('esqueleto')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('desde 400 ms muestra el skeleton, sin anunciar nada', () => {
    render(<EsperaTaller />)
    avanzar(400)
    expect(screen.getByTestId('esqueleto')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('desde 3 s anuncia el mensaje corto y muestra el isotipo', () => {
    render(<EsperaTaller />)
    avanzar(3000)
    expect(screen.getByRole('status')).toHaveTextContent('Estamos preparando el catálogo')
    expect(screen.getByTestId('isotipo-trazo')).toBeInTheDocument()
  })

  it('desde 15 s cambia al mensaje largo', () => {
    render(<EsperaTaller />)
    avanzar(15000)
    expect(screen.getByRole('status')).toHaveTextContent('La primera visita del día tarda un poco más')
  })
})
