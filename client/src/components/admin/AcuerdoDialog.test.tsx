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

  it('limita la direccion a 200 caracteres, lo que acepta el servidor', async () => {
    renderizar(pedidoAdmin({ entrega: { metodo: 'domicilio', detalle: 'Cra 5' } }))
    expect(screen.getByLabelText('Dirección de entrega')).toHaveAttribute('maxlength', '200')
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

  // el select tiene que mostrar exactamente la hora que se va a guardar, aunque no este en la lista del dia
  describe('hora fuera de la lista del dia', () => {
    const horaElegida = () =>
      (screen.getByLabelText('Hora acordada') as HTMLSelectElement).selectedOptions[0]?.textContent ?? ''

    it('una entrega guardada a las 6 p. m. (lista anterior) se muestra tal cual, no como "Sin hora"', () => {
      // lunes 14 de diciembre de 2026, 18:00 en Bogota
      renderizar(pedidoAdmin({ fechaEntrega: '2026-12-14T23:00:00.000Z' }))

      expect(screen.getByLabelText('Hora acordada')).toHaveValue('18:00')
      expect(horaElegida()).toMatch(/^6:00 p\. m\./)
    })

    it('al pasar de un dia entre semana a un sabado conserva las 5 p. m. y guarda esa misma hora', async () => {
      patchMock.mockResolvedValueOnce(pedidoAdmin({}))
      renderizar(pedidoAdmin({ _id: 'abc123' }))

      fireEvent.change(screen.getByLabelText('Fecha acordada'), { target: { value: '2026-10-02' } })
      await userEvent.selectOptions(screen.getByLabelText('Hora acordada'), '17:00')
      fireEvent.change(screen.getByLabelText('Fecha acordada'), { target: { value: '2026-10-03' } })

      expect(screen.getByLabelText('Hora acordada')).toHaveValue('17:00')
      expect(horaElegida()).toMatch(/^5:00 p\. m\./)
      expect(horaElegida()).toMatch(/fuera del horario/)

      await guardar()
      await waitFor(() => expect(patchMock).toHaveBeenCalled())
      expect(patchMock.mock.calls[0][1]).toMatchObject({
        fechaEntrega: new Date('2026-10-03T17:00:00-05:00').toISOString(),
      })
    })
  })

  describe('dia sin servicio', () => {
    it('avisa que ese dia no hay servicio y no bloquea el guardado', async () => {
      patchMock.mockResolvedValueOnce(pedidoAdmin({}))
      // domingo 4 de octubre de 2026
      renderizar(pedidoAdmin({ estado: 'en_revision', contactadoEn: '2026-09-28T10:00:00-05:00' }))
      fireEvent.change(screen.getByLabelText('Fecha acordada'), { target: { value: '2026-10-04' } })

      expect(screen.getByText(/ese día no hay servicio según el horario del taller/i)).toBeInTheDocument()

      await userEvent.selectOptions(screen.getByLabelText('Hora acordada'), '10:00')
      await guardar()

      expect(patchMock).toHaveBeenCalledWith(
        expect.stringContaining('/acuerdo'),
        expect.objectContaining({ fechaEntrega: new Date('2026-10-04T10:00:00-05:00').toISOString() }),
      )
    })

    it('en un dia sin servicio ofrece las horas de un dia ordinario', () => {
      renderizar(pedidoAdmin({ estado: 'en_revision' }))
      fireEvent.change(screen.getByLabelText('Fecha acordada'), { target: { value: '2026-10-04' } })

      const horas = Array.from(screen.getByLabelText('Hora acordada').querySelectorAll('option')).map((o) => o.textContent)
      expect(horas).toContain('8:00 a. m.')
      expect(horas).toContain('5:00 p. m.')
    })

    it('el aviso describe el campo de fecha solo mientras se muestra', () => {
      renderizar(pedidoAdmin({ estado: 'en_revision' }))
      const campoFecha = screen.getByLabelText('Fecha acordada')
      expect(campoFecha).not.toHaveAccessibleDescription(/no hay servicio/i)

      fireEvent.change(campoFecha, { target: { value: '2026-10-04' } })
      expect(campoFecha).toHaveAccessibleDescription(/ese día no hay servicio según el horario del taller/i)

      fireEvent.change(campoFecha, { target: { value: '2026-10-05' } })
      expect(campoFecha).not.toHaveAccessibleDescription(/no hay servicio/i)
    })

    it('no muestra el aviso en un dia con servicio y el sabado termina a las 3 p. m.', () => {
      renderizar(pedidoAdmin({ estado: 'en_revision' }))
      fireEvent.change(screen.getByLabelText('Fecha acordada'), { target: { value: '2026-10-03' } })

      expect(screen.queryByText(/no hay servicio/i)).not.toBeInTheDocument()
      const horas = Array.from(screen.getByLabelText('Hora acordada').querySelectorAll('option')).map((o) => o.textContent)
      expect(horas[horas.length - 1]).toBe('3:00 p. m.')
    })
  })
})
