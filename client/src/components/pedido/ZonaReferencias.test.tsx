import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { ZonaReferencias } from './ZonaReferencias'
import { MENSAJE_FORMATO_IMAGEN } from '../../lib/comprimirImagen'

vi.mock('../../lib/comprimirImagen', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/comprimirImagen')>()),
  comprimirImagen: vi.fn(async (f: File) => f),
}))
import { comprimirImagen, ErrorImagen } from '../../lib/comprimirImagen'

const img = (nombre: string, tipo = 'image/jpeg', bytes = 10) => new File([new Uint8Array(bytes)], nombre, { type: tipo })

// el componente es controlado: este contenedor guarda los archivos como lo haria el formulario
function Contenedor({ inicial = [] as File[], obligatoria = false, error }: { inicial?: File[]; obligatoria?: boolean; error?: string }) {
  const [archivos, setArchivos] = useState(inicial)
  return <ZonaReferencias archivos={archivos} onCambio={setArchivos} obligatoria={obligatoria} error={error} />
}

beforeEach(() => {
  vi.mocked(comprimirImagen).mockReset().mockImplementation(async (f) => f)
  URL.createObjectURL = vi.fn(() => 'blob:vista-previa')
  URL.revokeObjectURL = vi.fn()
})

describe('ZonaReferencias', () => {
  it('el area es un input de archivos real que acepta JPG, PNG y WebP', () => {
    render(<Contenedor />)
    const input = screen.getByLabelText(/Elige imágenes de referencia/i)
    expect(input).toHaveAttribute('type', 'file')
    expect(input).toHaveAttribute('accept', 'image/jpeg,image/png,image/webp')
    expect(input).toHaveAttribute('multiple')
  })

  it('agrega las imagenes elegidas con su vista previa y se pueden quitar', async () => {
    render(<Contenedor />)
    await userEvent.upload(screen.getByLabelText(/Elige imágenes de referencia/i), [img('a.jpg'), img('b.png', 'image/png')])

    expect(await screen.findByText('a.jpg')).toBeInTheDocument()
    expect(screen.getByText('b.png')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Quitar a.jpg' }))
    expect(screen.queryByText('a.jpg')).not.toBeInTheDocument()
    expect(screen.getByText('b.png')).toBeInTheDocument()
  })

  it('pasa cada imagen por la compresion antes de guardarla', async () => {
    const reducida = img('grande.webp', 'image/webp')
    vi.mocked(comprimirImagen).mockResolvedValueOnce(reducida)
    render(<Contenedor />)
    await userEvent.upload(screen.getByLabelText(/Elige imágenes de referencia/i), img('grande.jpg'))
    expect(await screen.findByText('grande.webp')).toBeInTheDocument()
  })

  it('rechaza un formato que no es imagen aceptada y lo explica', async () => {
    render(<Contenedor />)
    fireEvent.change(screen.getByLabelText(/Elige imágenes de referencia/i), {
      target: { files: [new File(['x'], 'doc.pdf', { type: 'application/pdf' })] },
    })
    expect(await screen.findByRole('alert')).toHaveTextContent(MENSAJE_FORMATO_IMAGEN)
    expect(screen.queryByText('doc.pdf')).not.toBeInTheDocument()
  })

  it('muestra el mensaje de la compresion cuando una imagen no se puede usar', async () => {
    vi.mocked(comprimirImagen).mockRejectedValueOnce(new ErrorImagen('Esa imagen pesa demasiado, incluso reducida.'))
    render(<Contenedor />)
    await userEvent.upload(screen.getByLabelText(/Elige imágenes de referencia/i), img('enorme.jpg'))
    expect(await screen.findByRole('alert')).toHaveTextContent('pesa demasiado')
  })

  it('con 3 imagenes ya no caben mas: la zona se desactiva y dice por que', async () => {
    render(<Contenedor inicial={[img('1.jpg'), img('2.jpg'), img('3.jpg')]} />)
    expect(screen.getByLabelText(/Elige imágenes de referencia/i)).toBeDisabled()
    expect(screen.getByText(/ya tienes 3 imágenes/i)).toBeInTheDocument()
  })

  it('si llegan mas de las que caben, guarda las que caben y avisa', async () => {
    render(<Contenedor inicial={[img('1.jpg'), img('2.jpg')]} />)
    await userEvent.upload(screen.getByLabelText(/Elige imágenes de referencia/i), [img('3.jpg'), img('4.jpg')])
    await waitFor(() => expect(screen.getByText('3.jpg')).toBeInTheDocument())
    expect(screen.queryByText('4.jpg')).not.toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(/hasta 3 imágenes/i)
  })

  it('acepta imagenes soltadas sobre el area (escritorio)', async () => {
    render(<Contenedor />)
    const area = screen.getByText(/Toca para elegir o arrastra aquí/i).closest('label')!
    fireEvent.drop(area, { dataTransfer: { files: [img('suelta.jpg')] } })
    expect(await screen.findByText('suelta.jpg')).toBeInTheDocument()
  })

  it('cuando es obligatoria lo dice, y el error de validacion queda enlazado al campo', () => {
    render(<Contenedor obligatoria error="Adjunta una imagen de referencia. Sin verla no podemos cotizar tu pedido." />)
    expect(screen.getByText(/obligatoria/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Elige imágenes de referencia/i)).toHaveAccessibleDescription(/Adjunta una imagen/)
    expect(screen.getByLabelText(/Elige imágenes de referencia/i)).toHaveAttribute('aria-invalid', 'true')
  })
})
