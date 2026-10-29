import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode, useState } from 'react'
import { ZonaReferencias } from './ZonaReferencias'

vi.mock('../../lib/comprimirImagen', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/comprimirImagen')>()),
  comprimirImagen: vi.fn(async (f: File) => f),
}))
import { comprimirImagen, ErrorImagen } from '../../lib/comprimirImagen'

const img = (nombre: string, tipo = 'image/jpeg', bytes = 10) => new File([new Uint8Array(bytes)], nombre, { type: tipo })
const CAMPO = /Elige una foto de referencia/i

// el componente es controlado: este contenedor guarda los archivos como lo haria el formulario
function Contenedor({
  inicial = [] as File[],
  obligatoria = false,
  error,
  onProcesando,
}: {
  inicial?: File[]
  obligatoria?: boolean
  error?: string
  onProcesando?: (procesando: boolean) => void
}) {
  const [archivos, setArchivos] = useState(inicial)
  return (
    <ZonaReferencias archivos={archivos} onCambio={setArchivos} obligatoria={obligatoria} error={error} onProcesando={onProcesando} />
  )
}

beforeEach(() => {
  vi.mocked(comprimirImagen).mockReset().mockImplementation(async (f) => f)
  let n = 0
  URL.createObjectURL = vi.fn(() => `blob:vista-previa-${++n}`)
  URL.revokeObjectURL = vi.fn()
})

describe('ZonaReferencias', () => {
  // el formulario bloquea Siguiente mientras tanto: la imagen todavia no esta en la lista
  it('avisa hacia arriba cuando empieza y termina de preparar imagenes', async () => {
    let terminar: (f: File) => void = () => {}
    vi.mocked(comprimirImagen).mockImplementationOnce(() => new Promise<File>((r) => (terminar = r)))
    const onProcesando = vi.fn()
    render(<Contenedor onProcesando={onProcesando} />)
    await userEvent.upload(screen.getByLabelText(CAMPO), img('a.jpg'))

    await waitFor(() => expect(onProcesando).toHaveBeenLastCalledWith(true))
    terminar(img('a.jpg'))
    await waitFor(() => expect(onProcesando).toHaveBeenLastCalledWith(false))
    expect(await screen.findByText('a.jpg')).toBeInTheDocument()
  })

  it('avisa que terminó de preparar también cuando todas se rechazan', async () => {
    vi.mocked(comprimirImagen).mockRejectedValueOnce(new ErrorImagen('x', 'formato'))
    const onProcesando = vi.fn()
    render(<Contenedor onProcesando={onProcesando} />)
    await userEvent.upload(screen.getByLabelText(CAMPO), img('a.jpg'))

    await screen.findByRole('dialog')
    expect(onProcesando).toHaveBeenLastCalledWith(false)
  })

  it('el area es un input de archivos real que acepta JPG, PNG y WebP', () => {
    render(<Contenedor />)
    const input = screen.getByLabelText(CAMPO)
    expect(input).toHaveAttribute('type', 'file')
    expect(input).toHaveAttribute('accept', 'image/jpeg,image/png,image/webp')
    expect(input).toHaveAttribute('multiple')
  })

  it('agrega las imagenes elegidas con su vista previa y se pueden quitar', async () => {
    render(<Contenedor />)
    await userEvent.upload(screen.getByLabelText(CAMPO), [img('a.jpg'), img('b.png', 'image/png')])

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
    await userEvent.upload(screen.getByLabelText(CAMPO), img('grande.jpg'))
    expect(await screen.findByText('grande.webp')).toBeInTheDocument()
  })

  it('un formato no aceptado abre el aviso y no queda en la lista', async () => {
    vi.mocked(comprimirImagen).mockRejectedValueOnce(new ErrorImagen('x', 'formato'))
    render(<Contenedor />)
    fireEvent.change(screen.getByLabelText(CAMPO), { target: { files: [new File(['x'], 'doc.pdf', { type: 'application/pdf' })] } })

    const aviso = await screen.findByRole('dialog')
    expect(aviso).toHaveTextContent(/doc\.pdf no es JPG, PNG ni WebP/)
    expect(screen.queryByRole('button', { name: 'Quitar doc.pdf' })).not.toBeInTheDocument()
  })

  it('una imagen que la compresion no puede usar abre el aviso con su motivo', async () => {
    vi.mocked(comprimirImagen).mockRejectedValueOnce(new ErrorImagen('x', 'peso'))
    render(<Contenedor />)
    await userEvent.upload(screen.getByLabelText(CAMPO), img('enorme.jpg'))
    expect(await screen.findByRole('dialog')).toHaveTextContent(/enorme\.jpg pesa demasiado/)
  })

  it('un error desconocido de la compresión se avisa como imagen ilegible', async () => {
    vi.mocked(comprimirImagen).mockRejectedValueOnce(new Error('boom'))
    render(<Contenedor />)
    await userEvent.upload(screen.getByLabelText(CAMPO), img('rara.jpg'))
    expect(await screen.findByRole('dialog')).toHaveTextContent(/No pudimos leer rara\.jpg/)
  })

  it('con 3 imagenes ya no caben mas: la zona se desactiva y dice por que', async () => {
    render(<Contenedor inicial={[img('1.jpg'), img('2.jpg'), img('3.jpg')]} />)
    expect(screen.getByLabelText(CAMPO)).toBeDisabled()
    expect(screen.getByText('Ya tienes 3 fotos')).toBeInTheDocument()
    expect(screen.getByText('Quita una si quieres cambiarla.')).toBeInTheDocument()
  })

  it('una selección mezclada conserva las válidas y abre un solo aviso con cada rechazo', async () => {
    vi.mocked(comprimirImagen).mockImplementation(async (f) => {
      if (f.name === 'iphone.heic') throw new ErrorImagen('x', 'heic')
      return f
    })
    render(<Contenedor inicial={[img('1.jpg')]} />)
    // fireEvent y no userEvent.upload: este ultimo filtra por `accept` y descartaria el HEIC, que en iOS si puede llegar por Archivos
    fireEvent.change(screen.getByLabelText(CAMPO), {
      target: { files: [img('2.jpg'), img('iphone.heic', 'image/heic'), img('3.jpg'), img('4.jpg')] },
    })

    const aviso = await screen.findByRole('dialog')
    expect(screen.getByText('2.jpg')).toBeInTheDocument()
    expect(screen.getByText('3.jpg')).toBeInTheDocument()
    expect(screen.queryByText('4.jpg')).not.toBeInTheDocument()
    expect(within(aviso).getAllByRole('listitem')).toHaveLength(2)
    expect(aviso).toHaveTextContent(/iphone\.heic está en formato HEIC/)
    expect(aviso).toHaveTextContent(/4\.jpg quedó fuera/)
  })

  it('un archivo rechazado no ocupa un lugar de los que caben', async () => {
    vi.mocked(comprimirImagen).mockImplementation(async (f) => {
      if (f.name === 'doc.pdf') throw new ErrorImagen('x', 'formato')
      return f
    })
    render(<Contenedor inicial={[img('1.jpg'), img('2.jpg')]} />)
    await userEvent.upload(screen.getByLabelText(CAMPO), [img('doc.pdf', 'application/pdf'), img('3.jpg')])

    expect(await screen.findByText('3.jpg')).toBeInTheDocument()
  })

  it('al cerrar el aviso el foco vuelve al campo de archivos', async () => {
    vi.mocked(comprimirImagen).mockRejectedValueOnce(new ErrorImagen('x', 'ilegible'))
    render(<Contenedor />)
    await userEvent.upload(screen.getByLabelText(CAMPO), img('mala.jpg'))
    await userEvent.click(await screen.findByRole('button', { name: 'Volver a mis fotos' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByLabelText(CAMPO)).toHaveFocus()
  })

  it('acepta imagenes soltadas sobre el area (escritorio)', async () => {
    render(<Contenedor />)
    const area = screen.getByText('Elige una foto').closest('label')!
    fireEvent.drop(area, { dataTransfer: { files: [img('suelta.jpg')] } })
    expect(await screen.findByText('suelta.jpg')).toBeInTheDocument()
  })

  it('el copy habla de una foto de referencia, sin cifras de peso ni verbos de arrastrar', () => {
    const { container } = render(<Contenedor />)
    expect(screen.getByText('Foto de referencia')).toBeInTheDocument()
    expect(screen.getByText('(opcional)')).toBeInTheDocument()
    expect(screen.getByText(/Con una foto nos alcanza para entender lo que imaginas\. Si quieres, puedes agregar hasta 3\./)).toBeInTheDocument()
    expect(screen.getByText('JPG, PNG o WebP. La preparamos para que se envíe rápido.')).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/\bMB\b|arrastra/i)
  })

  it('con una o dos fotos la zona invita a agregar otra', async () => {
    render(<Contenedor inicial={[img('1.jpg')]} />)
    expect(screen.getByText('Agregar otra foto')).toBeInTheDocument()
  })

  it('cuando es obligatoria lo dice, y el error de validacion queda enlazado al campo', () => {
    render(<Contenedor obligatoria error="Adjunta una imagen de referencia. Sin verla no podemos cotizar tu pedido." />)
    expect(screen.getByText('(obligatoria)')).toBeInTheDocument()
    expect(screen.getByLabelText(CAMPO)).toHaveAccessibleDescription(/Adjunta una imagen/)
    expect(screen.getByLabelText(CAMPO)).toHaveAttribute('aria-invalid', 'true')
  })

  it('las vistas previas sobreviven a un desmontaje y montaje simulados (StrictMode)', () => {
    const { container, unmount } = render(
      <StrictMode>
        <Contenedor inicial={[img('a.jpg')]} />
      </StrictMode>,
    )
    const src = container.querySelector('img')!.getAttribute('src')!
    expect(src).toMatch(/^blob:vista-previa-/)
    // la URL que quedo en la pantalla no es una de las ya revocadas
    const revocadas = vi.mocked(URL.revokeObjectURL).mock.calls.map((c) => c[0])
    expect(revocadas).not.toContain(src)
    unmount()
    expect(vi.mocked(URL.revokeObjectURL).mock.calls.map((c) => c[0])).toContain(src)
  })

  it('libera la URL de la vista previa al quitar la imagen', async () => {
    const { container } = render(<Contenedor inicial={[img('a.jpg')]} />)
    const src = container.querySelector('img')!.getAttribute('src')
    await userEvent.click(screen.getByRole('button', { name: 'Quitar a.jpg' }))
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(src)
  })

  it('mientras procesa no se puede quitar una imagen (evita que reaparezca)', async () => {
    let terminar!: (f: File) => void
    vi.mocked(comprimirImagen).mockImplementationOnce(() => new Promise<File>((r) => { terminar = r }))
    render(<Contenedor inicial={[img('a.jpg')]} />)
    await userEvent.upload(screen.getByLabelText(CAMPO), img('b.jpg'))
    expect(await screen.findByRole('status')).toHaveTextContent('Preparando tu foto')
    expect(screen.getByRole('button', { name: 'Quitar a.jpg' })).toBeDisabled()
    const b = img('b.jpg')
    terminar(b)
    expect(await screen.findByText('b.jpg')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Quitar a.jpg' })).toBeEnabled()
  })

  it('si una imagen falla, guarda las otras y avisa de la que falló', async () => {
    vi.mocked(comprimirImagen)
      .mockImplementationOnce(async (f) => f)
      .mockRejectedValueOnce(new ErrorImagen('x', 'peso'))
    render(<Contenedor />)
    await userEvent.upload(screen.getByLabelText(CAMPO), [img('buena.jpg'), img('mala.jpg')])
    expect(await screen.findByText('buena.jpg')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Quitar mala.jpg' })).not.toBeInTheDocument()
    expect(await screen.findByRole('dialog')).toHaveTextContent(/mala\.jpg pesa demasiado/)
  })
})
