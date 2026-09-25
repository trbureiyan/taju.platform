import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  it('renderiza con su texto como nombre accesible', () => {
    render(<Button>Enviar mi pedido</Button>)
    expect(screen.getByRole('button', { name: 'Enviar mi pedido' })).toBeInTheDocument()
  })

  it('dispara onClick', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Ver el detalle</Button>)
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it.each(['primario', 'secundario', 'fantasma'] as const)(
    'variante %s no anula el foco visible sin sustituto',
    (variante) => {
      render(<Button variante={variante}>Accion</Button>)
      const clases = screen.getByRole('button').className
      // quitar el outline solo es valido si el mismo elemento trae un anillo o sombra de foco propio
      if (/\boutline-none\b/.test(clases)) {
        expect(clases).toMatch(/focus-visible:(ring|shadow)/)
      }
    },
  )

  it('cargando bloquea el click, marca aria-busy y conserva el nombre accesible', async () => {
    const onClick = vi.fn()
    render(
      <Button cargando onClick={onClick}>
        Enviar mi pedido
      </Button>,
    )
    const boton = screen.getByRole('button', { name: 'Enviar mi pedido' })
    expect(boton).toBeDisabled()
    expect(boton).toHaveAttribute('aria-busy', 'true')
    await userEvent.click(boton)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('mantiene el objetivo tactil minimo en todas las tallas', () => {
    for (const tamano of ['sm', 'md', 'lg'] as const) {
      const { unmount } = render(<Button tamano={tamano}>Accion</Button>)
      expect(screen.getByRole('button').className).toMatch(/\bmin-h-boton\b/)
      unmount()
    }
  })
})
