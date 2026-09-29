import { describe, it, expect, vi, afterEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AcuerdoDialog } from './AcuerdoDialog'
import { SnackbarProvider } from '../ui/Snackbar'
import { api, ErrorApi } from '../../lib/api'
import { pedidoAdmin } from '../../test/pedidos'
import type { PedidoAdmin } from '../../types'

// ErrorApi real: el dialogo distingue el 409 (texto pensado para leerse) de cualquier otro fallo
vi.mock('../../lib/api', async (original) => {
  const real = await original<typeof import('../../lib/api')>()
  return { ...real, api: { patch: vi.fn() } }
})
const patchMock = vi.mocked(api.patch)

afterEach(() => vi.clearAllMocks())

function renderizar(p: PedidoAdmin) {
  const onGuardado = vi.fn()
  const onCerrar = vi.fn()
  render(
    <SnackbarProvider>
      <AcuerdoDialog pedido={p} onCerrar={onCerrar} onGuardado={onGuardado} />
    </SnackbarProvider>,
  )
  return { onGuardado, onCerrar }
}

const guardar = () => userEvent.click(screen.getByRole('button', { name: 'Guardar acuerdo' }))

describe('AcuerdoDialog', () => {
  it('muestra lo que pidio el cliente como referencia y no lo da por acordado', () => {
    renderizar(pedidoAdmin({ _id: 'abc123', fechaDeseada: '2026-12-12T22:00:00.000Z' }))

    expect(screen.getByRole('dialog', { name: 'Acuerdo de TJ-ABC123' })).toBeInTheDocument()
    expect(screen.getByText(/el cliente pidió: .*12 de diciembre/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Fecha acordada')).toHaveValue('')
  })

  it('guarda fecha con hora, entrega y anticipo, y avisa', async () => {
    const actualizado = pedidoAdmin({ _id: 'abc123', estado: 'en_revision' })
    patchMock.mockResolvedValueOnce(actualizado)
    const { onGuardado, onCerrar } = renderizar(pedidoAdmin({ _id: 'abc123' }))

    fireEvent.change(screen.getByLabelText('Fecha acordada'), { target: { value: '2026-12-14' } })
    await userEvent.selectOptions(screen.getByLabelText('Hora acordada'), '10:00')
    await userEvent.type(screen.getByLabelText('Anticipo recibido'), '50000')
    await userEvent.selectOptions(screen.getByLabelText('Medio del anticipo'), 'bancolombia')
    await guardar()

    await waitFor(() => expect(onGuardado).toHaveBeenCalledWith(actualizado))
    expect(patchMock).toHaveBeenCalledWith('/pedidos/abc123/acuerdo', {
      entrega: { metodo: 'recoger', detalle: '' },
      fechaEntrega: '2026-12-14T15:00:00.000Z',
      pago: { monto: 50000, medio: 'bancolombia' },
    })
    expect(onCerrar).toHaveBeenCalled()
    expect(await screen.findByText(/acuerdo de tj-abc123 guardado/i)).toBeInTheDocument()
  })

  it('fecha sin hora explica que falta y no envia', async () => {
    renderizar(pedidoAdmin({}))

    fireEvent.change(screen.getByLabelText('Fecha acordada'), { target: { value: '2026-12-14' } })
    await guardar()

    expect(screen.getByLabelText('Fecha acordada')).toHaveAccessibleDescription(/completa fecha y hora/i)
    expect(patchMock).not.toHaveBeenCalled()
  })

  it('un anticipo que no es un monto entero positivo no se envia', async () => {
    renderizar(pedidoAdmin({}))

    await userEvent.type(screen.getByLabelText('Anticipo recibido'), '-5')
    await guardar()

    expect(screen.getByLabelText('Anticipo recibido')).toHaveAccessibleDescription(/monto entero mayor a 0/i)
    expect(patchMock).not.toHaveBeenCalled()
  })

  it('no vuelve a registrar el anticipo si no cambio, para no mover su fecha', async () => {
    patchMock.mockResolvedValueOnce(pedidoAdmin({}))
    renderizar(
      pedidoAdmin({
        entrega: { metodo: 'domicilio', detalle: 'Cra 5' },
        pago: { monto: 50000, medio: 'nequi', registradoEn: '2026-09-29T15:00:00.000Z' },
      }),
    )

    await guardar()

    await waitFor(() => expect(patchMock).toHaveBeenCalled())
    expect(patchMock.mock.calls[0][1]).toEqual({ entrega: { metodo: 'domicilio', detalle: 'Cra 5' } })
  })

  it('si el server rechaza, avisa con el motivo y deja el dialogo abierto', async () => {
    patchMock.mockRejectedValueOnce(new ErrorApi('Este pedido ya está cerrado y no admite cambios', 409))
    const { onCerrar } = renderizar(pedidoAdmin({}))

    await guardar()

    expect(await screen.findByText(/ya está cerrado y no admite cambios/i)).toBeInTheDocument()
    expect(onCerrar).not.toHaveBeenCalled()
  })

  it('un fallo que no es un rechazo del taller no muestra el texto crudo', async () => {
    patchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const { onCerrar } = renderizar(pedidoAdmin({}))

    await guardar()

    expect(await screen.findByText('No pudimos guardar el acuerdo. Prueba de nuevo.')).toBeInTheDocument()
    expect(screen.queryByText(/failed to fetch/i)).not.toBeInTheDocument()
    expect(onCerrar).not.toHaveBeenCalled()
  })
})
