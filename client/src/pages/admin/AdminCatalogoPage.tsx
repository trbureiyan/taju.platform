import { useState, useEffect, type FormEvent } from 'react'
import { api } from '../../lib/api'
import type { Categoria, Producto, Familia } from '../../types'
import { ETIQUETAS_FAMILIA } from '../../types'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

const FAMILIAS: Familia[] = ['toppers', 'superficies', 'senaletica', 'papeleria']

// ──────────────────────────────────────────────────────────────
// Categorías
// ──────────────────────────────────────────────────────────────

// formulario controlado en su propio estado, onCreada solo lo empuja a la lista del padre - no hay
// fetch compartido, cada form es autonomo
function FormCategoria({ onCreada }: { onCreada: (c: Categoria) => void }) {
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [familia, setFamilia] = useState<Familia>('toppers')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setCargando(true)
    try {
      // [!] no se piden dimensionesBase aca, y actualizarCategoria (service) tampoco las acepta -
      // hoy no hay forma desde la UI de cargar medidas sugeridas para una categoria
      const creada = await api.post<Categoria>('/categorias', { nombre, descripcion, familia })
      setNombre('')
      setDescripcion('')
      onCreada(creada)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear categoría')
    } finally {
      setCargando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4 border border-borde-defecto rounded-tarjeta bg-superficie-elevada">
      <h3 className="font-medium text-texto-principal">Nueva categoría</h3>
      <Input label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
      <Input label="Descripción" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
      <div className="flex flex-col gap-1">
        <label className="text-sm text-texto-secundario">Familia</label>
        <select
          value={familia}
          onChange={(e) => setFamilia(e.target.value as Familia)}
          className="border border-borde-defecto rounded px-3 py-2 text-sm bg-superficie-base text-texto-principal"
          required
        >
          {FAMILIAS.map((f) => (
            <option key={f} value={f}>{ETIQUETAS_FAMILIA[f]}</option>
          ))}
        </select>
      </div>
      {error && <p className="text-sm text-error-texto">{error}</p>}
      <Button type="submit" cargando={cargando}>Crear categoría</Button>
    </form>
  )
}

// ──────────────────────────────────────────────────────────────
// Productos
// ──────────────────────────────────────────────────────────────

function FormProducto({
  categorias,
  onCreado,
}: {
  categorias: Categoria[]
  onCreado: (p: Producto) => void
}) {
  const [nombre, setNombre] = useState('')
  const [descripcionTecnica, setDescripcionTecnica] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  // pares libres (material, acabado, ocasion, etc) - el modelo ya los soporta como Map, faltaba la UI para cargarlos
  const [specs, setSpecs] = useState<{ clave: string; valor: string }[]>([])
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  function agregarSpec() {
    setSpecs((prev) => [...prev, { clave: '', valor: '' }])
  }

  function actualizarSpec(i: number, campo: 'clave' | 'valor', valor: string) {
    setSpecs((prev) => prev.map((s, idx) => (idx === i ? { ...s, [campo]: valor } : s)))
  }

  function quitarSpec(i: number) {
    setSpecs((prev) => prev.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!categoriaId) { setError('Seleccioná una categoría'); return }
    setError(null)
    setCargando(true)
    try {
      // claves vacias se descartan - un renglon a medio llenar no debe mandar basura al Map del backend
      const especificacionesTecnicas = Object.fromEntries(
        specs.filter((s) => s.clave.trim()).map((s) => [s.clave.trim(), s.valor.trim()]),
      )
      // [!] sin campo de imagenes: el producto se crea con imagenes: [] (ver Producto.ts) y ProductoCard
      // cae al placeholder hasta que alguien las agregue por otro medio - no hay upload de fotos de producto en admin
      const creado = await api.post<Producto>('/productos', {
        nombre,
        descripcionTecnica,
        categoria: categoriaId,
        especificacionesTecnicas,
      })
      setNombre('')
      setDescripcionTecnica('')
      setSpecs([])
      onCreado(creado)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear producto')
    } finally {
      setCargando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4 border border-borde-defecto rounded-tarjeta bg-superficie-elevada">
      <h3 className="font-medium text-texto-principal">Nuevo producto</h3>
      <div className="flex flex-col gap-1">
        <label className="text-sm text-texto-secundario">Categoría</label>
        <select
          value={categoriaId}
          onChange={(e) => setCategoriaId(e.target.value)}
          className="border border-borde-defecto rounded px-3 py-2 text-sm bg-superficie-base text-texto-principal"
          required
        >
          <option value="">— Seleccioná —</option>
          {categorias.map((c) => (
            <option key={c._id} value={c._id}>
              {ETIQUETAS_FAMILIA[c.familia]} / {c.nombre}
            </option>
          ))}
        </select>
      </div>
      <Input label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
      <Input
        label="Descripción técnica"
        value={descripcionTecnica}
        onChange={(e) => setDescripcionTecnica(e.target.value)}
      />

      <div className="flex flex-col gap-2">
        <label className="text-sm text-texto-secundario">Especificaciones (opcional)</label>
        {specs.map((s, i) => (
          <div key={i} className="flex gap-2 items-start">
            <input
              placeholder="Clave (ej. ocasion, material)"
              value={s.clave}
              onChange={(e) => actualizarSpec(i, 'clave', e.target.value)}
              className="flex-1 border border-borde-defecto rounded px-3 py-2 text-sm bg-superficie-base text-texto-principal"
            />
            <input
              placeholder="Valor (ej. cumpleanos)"
              value={s.valor}
              onChange={(e) => actualizarSpec(i, 'valor', e.target.value)}
              className="flex-1 border border-borde-defecto rounded px-3 py-2 text-sm bg-superficie-base text-texto-principal"
            />
            <button
              type="button"
              onClick={() => quitarSpec(i)}
              aria-label="Quitar especificación"
              className="text-xs px-3 py-2 rounded border border-borde-defecto text-texto-secundario hover:border-error-borde hover:text-error-texto"
            >
              Quitar
            </button>
          </div>
        ))}
        <Button type="button" variante="secundario" tamano="sm" onClick={agregarSpec} className="self-start">
          Agregar especificación
        </Button>
      </div>

      {error && <p className="text-sm text-error-texto">{error}</p>}
      <Button type="submit" cargando={cargando}>Crear producto</Button>
    </form>
  )
}

// ──────────────────────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────────────────────

export function AdminCatalogoPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // error puntual de una fila (activar/desactivar/eliminar), separado del error de carga inicial de arriba
  const [errorFila, setErrorFila] = useState<string | null>(null)

  useEffect(() => {
    // ambas listas se necesitan de entrada (el form de producto usa las categorias), asi que van en paralelo
    Promise.all([
      api.get<Categoria[]>('/categorias'),
      api.get<Producto[]>('/productos'),
    ])
      .then(([cats, prods]) => {
        setCategorias(cats)
        setProductos(prods)
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setCargando(false))
  }, [])

  async function toggleActivo(id: string, activo: boolean) {
    setErrorFila(null)
    try {
      await api.patch<Producto>(`/productos/${id}`, { activo: !activo })
      setProductos((prev) =>
        prev.map((p) => (p._id === id ? { ...p, activo: !activo } : p)),
      )
    } catch (err) {
      setErrorFila(err instanceof Error ? err.message : 'No pudimos actualizar el producto')
    }
  }

  async function eliminarProducto(id: string) {
    if (!window.confirm('¿Eliminar este producto? No se puede deshacer.')) return
    setErrorFila(null)
    try {
      await api.delete(`/productos/${id}`)
      setProductos((prev) => prev.filter((p) => p._id !== id))
    } catch (err) {
      setErrorFila(err instanceof Error ? err.message : 'No pudimos eliminar el producto')
    }
  }

  if (cargando) return <p className="text-texto-secundario p-8">Cargando catálogo…</p>
  if (error) return <p className="text-error-texto p-8">{error}</p>

  return (
    <div className="max-w-4xl mx-auto p-6 flex flex-col gap-10">
      <h1 className="text-2xl font-semibold text-texto-principal">Gestión del catálogo</h1>

      {/* Categorías */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium text-texto-principal">Categorías</h2>
        <FormCategoria onCreada={(c) => setCategorias((prev) => [...prev, c])} />

        <ul className="flex flex-col gap-2 mt-2">
          {categorias.map((c) => (
            <li
              key={c._id}
              className="flex items-center justify-between px-4 py-2 border border-borde-defecto rounded-tarjeta bg-superficie-elevada"
            >
              <span className="text-sm text-texto-principal">
                <span className="font-medium">{ETIQUETAS_FAMILIA[c.familia]}</span>
                {' / '}
                {c.nombre}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  c.activo ? 'bg-exito-fondo text-exito-texto' : 'bg-borde-defecto text-texto-secundario'
                }`}
              >
                {c.activo ? 'Activa' : 'Inactiva'}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Productos */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium text-texto-principal">Productos</h2>
        <FormProducto categorias={categorias} onCreado={(p) => setProductos((prev) => [...prev, p])} />

        {errorFila && (
          <p role="alert" className="text-sm text-error-texto">
            {errorFila}
          </p>
        )}

        <ul className="flex flex-col gap-2 mt-2">
          {productos.map((p) => (
            <li
              key={p._id}
              className="flex items-center justify-between px-4 py-3 border border-borde-defecto rounded-tarjeta bg-superficie-elevada"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-texto-principal">{p.nombre}</span>
                <span className="text-xs text-texto-secundario">
                  {typeof p.categoria === 'object'
                    ? `${ETIQUETAS_FAMILIA[p.categoria.familia]} / ${p.categoria.nombre}`
                    : '—'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActivo(p._id, p.activo)}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                    p.activo
                      ? 'border-borde-defecto text-texto-secundario hover:border-error-borde hover:text-error-texto'
                      : 'border-exito-borde text-exito-texto hover:bg-exito-fondo'
                  }`}
                >
                  {p.activo ? 'Desactivar' : 'Activar'}
                </button>
                <button
                  onClick={() => eliminarProducto(p._id)}
                  className="text-xs px-3 py-1 rounded-full border border-borde-defecto text-texto-secundario hover:border-error-borde hover:text-error-texto transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
