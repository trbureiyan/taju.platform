import { Categoria } from '../../models/Categoria.js'
import { Producto } from '../../models/Producto.js'
import type { Familia } from '../../types/index.js'

// ─── Categorias ─────────────────────────────────────────────────────────────

// activo:true siempre en las lecturas publicas - las desactivadas solo se ven desde el panel de admin
export async function listarCategorias(familia?: Familia) {
  const filtro = familia ? { familia, activo: true } : { activo: true }
  return Categoria.find(filtro).sort({ nombre: 1 }).lean()
}

export async function obtenerCategoria(id: string) {
  const categoria = await Categoria.findById(id).lean()
  if (!categoria) throw new Error('Categoría no encontrada')
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
  if (!categoria) throw new Error('Categoría no encontrada')
  return categoria
}

// ─── Productos ───────────────────────────────────────────────────────────────

export async function listarProductos(familia?: Familia, categoriaId?: string) {
  const filtro: Record<string, unknown> = { activo: true }

  if (categoriaId) {
    filtro.categoria = categoriaId
  } else if (familia) {
    // producto no guarda familia directo, asi que primero resolvemos que categorias pertenecen a ella
    const cats = await Categoria.find({ familia, activo: true }).select('_id').lean()
    filtro.categoria = { $in: cats.map((c) => c._id) }
  }

  return Producto.find(filtro)
    .populate('categoria', 'nombre familia')
    .sort({ nombre: 1 })
    .lean()
}

export async function obtenerProducto(id: string) {
  const producto = await Producto.findOne({ _id: id, activo: true })
    .populate('categoria', 'nombre familia')
    .lean()
  if (!producto) throw new Error('Producto no encontrado')
  return producto
}

// valida que la categoria exista antes de crear - un ObjectId invalido rompe el ref silenciosamente sin este chequeo
export async function crearProducto(datos: {
  nombre: string
  descripcionTecnica?: string
  categoria: string
  imagenes?: string[]
}) {
  const cat = await Categoria.findById(datos.categoria)
  if (!cat) throw new Error('Categoría no encontrada')
  return Producto.create(datos)
}

export async function actualizarProducto(
  id: string,
  datos: Partial<{ nombre: string; descripcionTecnica: string; imagenes: string[]; activo: boolean }>,
) {
  const producto = await Producto.findByIdAndUpdate(id, datos, { new: true })
  if (!producto) throw new Error('Producto no encontrado')
  return producto
}
