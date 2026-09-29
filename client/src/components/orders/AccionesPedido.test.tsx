import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AccionesPedido } from './AccionesPedido'
import { SnackbarProvider } from '../ui/Snackbar'
import { api, ErrorApi } from '../../lib/api'
import { pedido } from '../../test/pedidos'
import type { EstadoPedido } from '../../types'

vi.mock('../../lib/api', async (original) => {
  const real = await original<typeof import('../../lib/api')>()
  return { ...real, api: { patch: vi.fn() } }
})
const patchMock = vi.mocked(api.patch)

afterEach(() => vi.clearAllMocks())

function renderizar(estado: EstadoPedido, onCancelado = vi.fn(), onRechazado = vi.fn()) {
  render(
    <MemoryRouter>
      <SnackbarProvider>
        <AccionesPedido
          productoId="p1"
          pedidoId="abc123"
          nombreProducto="Topper luna"
          codigo="TJ-3F9A2C"
          estado={estado}
          onCancelado={onCancelado}
          onRechazado={onRechazado}
        />
      </SnackbarProvider>
    </MemoryRouter>,
  )
  return onCancelado
}

const disparador = () => screen.getAllByRole('button', { name: 'Cancelar mi solicitud' })[0]

describe('AccionesPedido', () => {
  it('enlaza a pedir de nuevo y arma el mensaje de WhatsApp con codigo y producto', () => {
    renderizar('confirmado')

    const pedirDeNuevo = screen.getAllByRole('link', { name: /pedir de nuevo/i })[0]
    expect(pedirDeNuevo).toHaveAttribute('href', '/pedido/p1?desde=abc123')

    const whatsapp = screen.getAllByRole('link', { name: /escríbenos por este pedido/i })[0]
    expect(whatsapp.getAttribute('href')).toContain(encodeURIComponent('TJ-3F9A2C'))
    expect(whatsapp.getAttribute('href')).toContain(encodeURIComponent('Topper luna'))
  })

  // [Review Focus] cancelar solo mientras el taller no confirma: despues se habla por WhatsApp
  it.each(['recibido', 'en_revision'] as const)('en %s ofrece cancelar', (estado) => {
    renderizar(estado)
    expect(screen.getAllByRole('button', { name: 'Cancelar mi solicitud' }).length).toBeGreaterThan(0)
  })

  it.each(['confirmado', 'en_produccion', 'listo_para_entrega', 'entregado', 'cancelado'] as const)(
    'en %s no ofrece cancelar',
    (estado) => {
      renderizar(estado)
      expect(screen.queryAllByRole('button', { name: 'Cancelar mi solicitud' })).toHaveLength(0)
    },
  )

  it('confirmar en el dialogo cancela, avisa y entrega el pedido actualizado', async () => {
    const cancelado = pedido({ _id: 'abc123', estado: 'cancelado' })
    patchMock.mockResolvedValueOnce(cancelado)
    const onCancelado = renderizar('recibido')

    await userEvent.click(disparador())
    expect(screen.getByRole('dialog', { name: '¿Cancelar tu solicitud?' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Sí, cancelar mi solicitud' }))

    await waitFor(() => expect(onCancelado).toHaveBeenCalledWith(cancelado))
    expect(patchMock).toHaveBeenCalledWith('/pedidos/abc123/cancelar', {})
    expect(await screen.findByText(/cancelamos tu solicitud/i)).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('mantener la solicitud cierra el dialogo sin llamar al server', async () => {
    const onCancelado = renderizar('recibido')

    await userEvent.click(disparador())
    await userEvent.click(screen.getByRole('button', { name: 'Mantener mi solicitud' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(patchMock).not.toHaveBeenCalled()
    expect(onCancelado).not.toHaveBeenCalled()
  })

  it('si el server rechaza con 409 explica el motivo y no da el pedido por cancelado', async () => {
    patchMock.mockRejectedValueOnce(
      new ErrorApi('Tu pedido ya está confirmado. Escríbenos por WhatsApp y lo revisamos contigo.', 409),
    )
    const onRechazado = vi.fn()
    const onCancelado = renderizar('en_revision', vi.fn(), onRechazado)

    await userEvent.click(disparador())
    await userEvent.click(screen.getByRole('button', { name: 'Sí, cancelar mi solicitud' }))

    expect(await screen.findByText(/ya está confirmado\. escríbenos por whatsapp/i)).toBeInTheDocument()
    expect(onCancelado).not.toHaveBeenCalled()
    // el estado que vio el cliente ya no es el real: se vuelve a pedir el pedido
    expect(onRechazado).toHaveBeenCalledTimes(1)
  })

  // texto de sistema o de red nunca llega al cliente
  it('ante cualquier otro fallo usa un mensaje propio y no el texto crudo', async () => {
    patchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const onCancelado = renderizar('recibido')

    await userEvent.click(disparador())
    await userEvent.click(screen.getByRole('button', { name: 'Sí, cancelar mi solicitud' }))

    expect(await screen.findByText(/no pudimos cancelar tu solicitud/i)).toBeInTheDocument()
    expect(screen.queryByText(/failed to fetch/i)).not.toBeInTheDocument()
    expect(onCancelado).not.toHaveBeenCalled()
  })
})
