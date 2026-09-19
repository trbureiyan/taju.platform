import { Categoria } from '../../models/Categoria.js'
import { Producto } from '../../models/Producto.js'
import type { Familia } from '../../types/index.js'
import { AppError } from '../../lib/errors.js'

// ─── Categorias ─────────────────────────────────────────────────────────────

// activo:true siempre en las lecturas publicas - las desactivadas solo se ven desde el panel de admin
export async function listarCategorias(familia?: Familia, esAdmin = false) {
  const filtro: Record<string, unknown> = {}
  if (familia) filtro.familia = familia
  if (!esAdmin) filtro.activo = true
  return Categoria.find(filtro).sort({ nombre: 1 }).lean()
}

export async function obtenerCategoria(id: string, esAdmin = false) {
  const filtro: Record<string, unknown> = { _id: id }
  if (!esAdmin) filtro.activo = true
  const categoria = await Categoria.findOne(filtro).lean()
  if (!categoria) throw new AppError(404, 'Categoría no encontrada')
  return categoria
}

// familia se fija aqui y ya - actualizarCategoria abajo no la deja tocar
export async function crearCategoria(datos: {
  nombre: string
  descripcion?: string
  familia: Familia
  dimensionesBase?: { etiqueta: string; valor: number }[]
}) {
  return Categoria.create(datos)
}

// el tipo de "datos" solo deja nombre/descripcion/activo, pero como el controller no valida con zod
// (ver el [!] en catalog.controller.ts) esto es documentacion de intencion, no una barrera real todavia -
// cambiar la familia aca romperia el snapshot embebido en pedidos ya hechos
export async function actualizarCategoria(
  id: string,
  datos: Partial<{ nombre: string; descripcion: string; activo: boolean }>,
) {
  const categoria = await Categoria.findByIdAndUpdate(id, datos, { new: true })
  if (!categoria) throw new AppError(404, 'Categoría no encontrada')
  return categoria
}

// ─── Productos ───────────────────────────────────────────────────────────────

// categoria "poblable" - una categoria desactivada no debe filtrar productos por ninguna via publica,
// aunque el producto individual siga marcado activo:true
async function categoriasVisibles(familia: Familia | undefined, esAdmin: boolean) {
  const filtro: Record<string, unknown> = {}
  if (familia) filtro.familia = familia
  if (!esAdmin) filtro.activo = true
  return Categoria.find(filtro).select('_id').lean()
}

export async function listarProductos(familia?: Familia, categoriaId?: string, esAdmin = false) {
  const filtro: Record<string, unknown> = {}
  if (!esAdmin) filtro.activo = true

  if (categoriaId) {
    if (!esAdmin) {
      // una categoria desactivada no expone sus productos aunque se conozca el id exacto
      const cat = await Categoria.findOne({ _id: categoriaId, activo: true }).select('_id').lean()
      if (!cat) return []
    }
    filtro.categoria = categoriaId
  } else if (familia) {
    // producto no guarda familia directo, asi que primero resolvemos que categorias pertenecen a ella
    const cats = await categoriasVisibles(familia, esAdmin)
    filtro.categoria = { $in: cats.map((c) => c._id) }
  } else if (!esAdmin) {
    // sin filtro de familia/categoria: igual hay que excluir productos cuya categoria este desactivada
    const cats = await categoriasVisibles(undefined, false)
    filtro.categoria = { $in: cats.map((c) => c._id) }
  }

  return Producto.find(filtro)
    .populate('categoria', 'nombre familia dimensionesBase')
    .sort({ nombre: 1 })
    .lean()
}

export async function obtenerProducto(id: string, esAdmin = false) {
  const filtro: Record<string, unknown> = { _id: id }
  if (!esAdmin) filtro.activo = true
  const producto = await Producto.findOne(filtro)
    .populate('categoria', 'nombre familia dimensionesBase activo')
    .lean()
  if (!producto) throw new AppError(404, 'Producto no encontrado')
  // categoria desactivada oculta el producto en publico aunque el producto siga activo:true
  const categoria = producto.categoria as { activo?: boolean } | null
  if (!esAdmin && categoria && categoria.activo === false) throw new AppError(404, 'Producto no encontrado')
  if (esAdmin) return producto
  // el publico no necesita ver el flag de actividad de la categoria referenciada
  const categoriaPublica = { ...categoria }
  delete categoriaPublica.activo
  return { ...producto, categoria: categoriaPublica }
}

// valida que la categoria exista antes de crear - un ObjectId invalido rompe el ref silenciosamente sin este chequeo
export async function crearProducto(datos: {
  nombre: string
  descripcionTecnica?: string
  categoria: string
  imagenes?: string[]
  especificacionesTecnicas?: Record<string, string>
  precio?: { unitario?: number | null; escalas?: { cantidadMinima: number; precioUnitario: number }[] }
}) {
  const cat = await Categoria.findById(datos.categoria)
  if (!cat) throw new AppError(400, 'Categoría no encontrada')
  return Producto.create(datos)
}

export async function actualizarProducto(
  id: string,
  datos: Partial<{
    nombre: string
    descripcionTecnica: string
    imagenes: string[]
    especificacionesTecnicas: Record<string, string>
    precio: { unitario?: number | null; escalas?: { cantidadMinima: number; precioUnitario: number }[] }
    activo: boolean
  }>,
) {
  const producto = await Producto.findByIdAndUpdate(id, datos, { new: true })
  if (!producto) throw new AppError(404, 'Producto no encontrado')
  return producto
}

export async function eliminarProducto(id: string) {
  const producto = await Producto.findByIdAndDelete(id)
  if (!producto) throw new AppError(404, 'Producto no encontrado')
}
