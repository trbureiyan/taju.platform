import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AdminPedidosPage } from './AdminPedidosPage'
import { SnackbarProvider } from '../../components/ui/Snackbar'
import { api, ErrorApi } from '../../lib/api'
import { pedidoAdmin } from '../../test/pedidos'
import { codigoPedido } from '../../lib/pedido'

// ErrorApi real: la pagina solo muestra el texto del server en un 409, el resto cae a un aviso neutro
vi.mock('../../lib/api', async (original) => {
  const real = await original<typeof import('../../lib/api')>()
  return { ...real, api: { get: vi.fn(), patch: vi.fn(), post: vi.fn() } }
})

afterEach(() => vi.clearAllMocks())

function renderizar() {
  return render(
    <SnackbarProvider>
      <AdminPedidosPage />
    </SnackbarProvider>,
  )
}

describe('AdminPedidosPage', () => {
  it('muestra la columna Código con el mismo codigo que ve el cliente', async () => {
    vi.mocked(api.get).mockResolvedValueOnce([pedidoAdmin({ _id: 'abc123' })])
    renderizar()

    await waitFor(() => expect(screen.getByText('Código')).toBeInTheDocument())
    expect(screen.getByText(codigoPedido('abc123'))).toBeInTheDocument()
  })

  it('el celular del cliente es un enlace a su WhatsApp con la solicitud nombrada por su codigo', async () => {
    vi.mocked(api.get).mockResolvedValueOnce([pedidoAdmin({ _id: 'abc123' })])
    renderizar()

    const enlace = await screen.findByRole('link', { name: 'Escribir por WhatsApp a Laura' })
    expect(enlace).toHaveAttribute('href', expect.stringContaining('wa.me/573192452842'))
    expect(decodeURIComponent(enlace.getAttribute('href')!)).toContain(codigoPedido('abc123'))
  })

  it('"Ya le escribí" marca el contacto, mueve la fila a en revision y avisa', async () => {
    vi.mocked(api.get).mockResolvedValueOnce([pedidoAdmin({ _id: 'abc123', estado: 'recibido' })])
    vi.mocked(api.post).mockResolvedValueOnce(
      pedidoAdmin({ _id: 'abc123', estado: 'en_revision', contactadoEn: '2026-09-28T15:00:00.000Z' }),
    )
    renderizar()

    await userEvent.click(await screen.findByRole('button', { name: 'Ya le escribí' }))

    expect(api.post).toHaveBeenCalledWith('/pedidos/abc123/contacto', {})
    expect(await screen.findByText(/tj-abc123 marcado como contactado/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ya le escribí' })).not.toBeInTheDocument()
  })

  // [Review Focus] el boton se deshabilita y el motivo queda a la vista, no se descubre al fallar
  it('confirmar sin acuerdo completo queda deshabilitado y dice que falta', async () => {
    vi.mocked(api.get).mockResolvedValueOnce([pedidoAdmin({ _id: 'abc123', estado: 'en_revision' })])
    renderizar()

    const avanzar = await screen.findByRole('button', { name: '→ Confirmado' })
    expect(avanzar).toBeDisabled()
    expect(
      screen.getByText('Falta: marcar que ya hablaste con el cliente, la fecha de entrega acordada'),
    ).toBeInTheDocument()
    expect(avanzar).toHaveAccessibleDescription(/falta: marcar que ya hablaste/i)
  })

  it('con el acuerdo completo, avanzar pide confirmacion en un dialogo y luego lo ejecuta', async () => {
    const listo = pedidoAdmin({
      _id: 'abc123',
      estado: 'en_revision',
      contactadoEn: '2026-09-28T15:00:00.000Z',
      fechaEntrega: '2026-10-05T15:00:00.000Z',
    })
    vi.mocked(api.get).mockResolvedValueOnce([listo])
    vi.mocked(api.patch).mockResolvedValueOnce({ ...listo, estado: 'confirmado' })
    renderizar()

    await userEvent.click(await screen.findByRole('button', { name: '→ Confirmado' }))
    const dialogo = screen.getByRole('dialog', { name: 'Pasar TJ-ABC123 a "Confirmado"' })
    expect(api.patch).not.toHaveBeenCalled()
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Pasar a "Confirmado"' }))

    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith('/pedidos/abc123/estado', {
        estado: 'confirmado',
        confirmarDimensionPersonalizada: false,
      }),
    )
    expect(await screen.findByText(/tj-abc123 pasó a "confirmado"/i)).toBeInTheDocument()
  })

  it('cancelar pide confirmacion y usa el estado cancelado', async () => {
    vi.mocked(api.get).mockResolvedValueOnce([pedidoAdmin({ _id: 'abc123', estado: 'recibido' })])
    vi.mocked(api.patch).mockResolvedValueOnce(pedidoAdmin({ _id: 'abc123', estado: 'cancelado' }))
    renderizar()

    await userEvent.click(await screen.findByRole('button', { name: 'Cancelar pedido' }))
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar pedido' }))

    await waitFor(() =>
      expect(api.patch).toHaveBeenCalledWith('/pedidos/abc123/estado', { estado: 'cancelado' }),
    )
  })

  it('un rechazo del server se explica en un aviso y la fila no cambia', async () => {
    vi.mocked(api.get).mockResolvedValueOnce([pedidoAdmin({ _id: 'abc123', estado: 'recibido' })])
    vi.mocked(api.post).mockRejectedValueOnce(new ErrorApi('Este pedido ya está cerrado', 409))
    renderizar()

    await userEvent.click(await screen.findByRole('button', { name: 'Ya le escribí' }))

    expect(await screen.findByText('Este pedido ya está cerrado')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ya le escribí' })).toBeInTheDocument()
  })

  it('un fallo que no es un rechazo del taller no muestra el texto crudo', async () => {
    vi.mocked(api.get).mockResolvedValueOnce([pedidoAdmin({ _id: 'abc123', estado: 'recibido' })])
    vi.mocked(api.post).mockRejectedValueOnce(new ErrorApi('Error 500', 500))
    renderizar()

    await userEvent.click(await screen.findByRole('button', { name: 'Ya le escribí' }))

    expect(await screen.findByText('No pudimos actualizar el pedido. Prueba de nuevo.')).toBeInTheDocument()
    expect(screen.queryByText('Error 500')).not.toBeInTheDocument()
  })

  it('si la lista no carga, explica que hacer sin mostrar el error crudo', async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new TypeError('Failed to fetch'))
    renderizar()

    expect(await screen.findByRole('alert')).toHaveTextContent(/no pudimos cargar los pedidos/i)
    expect(screen.queryByText(/failed to fetch/i)).not.toBeInTheDocument()
  })

  it('el filtro "Sin contactar" deja solo lo que espera un primer mensaje', async () => {
    vi.mocked(api.get).mockResolvedValueOnce([
      pedidoAdmin({ _id: 'aaa111', nombre: 'Topper luna', estado: 'recibido' }),
      pedidoAdmin({ _id: 'bbb222', nombre: 'Blonda grabada', estado: 'en_revision', contactadoEn: '2026-09-28T15:00:00.000Z' }),
    ])
    renderizar()

    await userEvent.click(await screen.findByRole('button', { name: 'Sin contactar (1)' }))

    expect(screen.getByText('Topper luna')).toBeInTheDocument()
    expect(screen.queryByText('Blonda grabada')).not.toBeInTheDocument()
  })

  // [Review Focus] un pedido cancelado no ofrece acciones ni cuenta como pendiente
  it('un pedido cancelado no ofrece ninguna accion y no cuenta como sin contactar', async () => {
    vi.mocked(api.get).mockResolvedValueOnce([pedidoAdmin({ _id: 'abc123', estado: 'cancelado' })])
    renderizar()

    expect(await screen.findByRole('button', { name: 'Sin contactar (0)' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ya le escribí' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Registrar acuerdo' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancelar pedido' })).not.toBeInTheDocument()
  })
})
