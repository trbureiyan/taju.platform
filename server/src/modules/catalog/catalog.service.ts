import { Categoria } from '../../models/Categoria.js'
import { Producto } from '../../models/Producto.js'
import type { Familia } from '../../types/index.js'
import { AppError } from '../../lib/errors.js'

// ─── Categorias ─────────────────────────────────────────────────────────────

/**
 * Obtiene todas las categorías.
 * @param familia - Si se provee, filtra por esa familia.
 * @param esAdmin - Si es true, incluye categorías inactivas.
 * @returns Array de categorías planas.
 */
export async function listarCategorias(familia?: Familia, esAdmin = false) {
  const filtro: Record<string, unknown> = {}
  if (familia) filtro.familia = familia
  if (!esAdmin) filtro.activo = true
  return Categoria.find(filtro).sort({ nombre: 1 }).lean()
}

/**
 * Obtiene una categoría por su ID.
 * @param id - ID de la categoría.
 * @param esAdmin - Si es falso y la categoría está inactiva, lanza error 404.
 * @throws AppError 404 si no existe o está inactiva y no es admin.
 */
export async function obtenerCategoria(id: string, esAdmin = false) {
  const filtro: Record<string, unknown> = { _id: id }
  if (!esAdmin) filtro.activo = true
  const categoria = await Categoria.findOne(filtro).lean()
  if (!categoria) throw new AppError(404, 'Categoría no encontrada')
  return categoria
}

/**
 * Crea una nueva categoría. La familia se fija aquí y no puede modificarse después.
 */
export async function crearCategoria(datos: {
  nombre: string
  descripcion?: string
  familia: Familia
  dimensionesBase?: { etiqueta: string; valor: number }[]
}) {
  return Categoria.create(datos)
}

/**
 * Actualiza los datos permitidos de una categoría.
 * La familia no se expone aquí porque cambiarla rompería el snapshot embebido en pedidos ya hechos.
 */
export async function actualizarCategoria(
  id: string,
  datos: Partial<{ nombre: string; descripcion: string; activo: boolean }>,
) {
  const categoria = await Categoria.findByIdAndUpdate(id, datos, { new: true })
  if (!categoria) throw new AppError(404, 'Categoría no encontrada')
  return categoria
}

// ─── Productos ───────────────────────────────────────────────────────────────

/**
 * Obtiene los IDs de las categorías visibles según la familia y el rol.
 */
async function categoriasVisibles(familia: Familia | undefined, esAdmin: boolean) {
  const filtro: Record<string, unknown> = {}
  if (familia) filtro.familia = familia
  if (!esAdmin) filtro.activo = true
  return Categoria.find(filtro).select('_id').lean()
}

/**
 * Obtiene todos los productos, con su categoría poblada.
 * Si no es admin, oculta productos inactivos o cuyas categorías estén inactivas.
 * @param familia - Filtrar por familia.
 * @param categoriaId - Filtrar por categoría específica.
 * @param esAdmin - Si es true, incluye productos y categorías inactivas.
 */
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

/**
 * Obtiene un producto individual poblado con su categoría.
 * @throws AppError 404 si no existe, o si está inactivo/su categoría está inactiva (y no es admin).
 */
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

function validarPrecioPorFamilia(familia: Familia, precio: { unitario?: number | null; escalas?: { cantidadMinima: number; precioUnitario: number }[] }) {
  if (familia === 'superficies') {
    if (!precio.escalas || precio.escalas.length === 0) {
      throw new AppError(400, 'Los productos de superficies requieren precio por escalas')
    }
    const cantidadMin = Math.min(...precio.escalas.map(e => e.cantidadMinima))
    if (cantidadMin < 12) {
      throw new AppError(400, 'La cantidad mínima para superficies es de 12 unidades')
    }
  } else {
    if (precio.unitario == null) {
      throw new AppError(400, 'Este producto requiere un precio unitario')
    }
  }
}

/**
 * Crea un producto asegurando que la categoría exista y el modelo de precio sea coherente.
 */
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
  if (datos.precio) validarPrecioPorFamilia(cat.familia as Familia, datos.precio)
  return Producto.create(datos)
}

/**
 * Actualiza los datos de un producto.
 */
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
  if (datos.precio) {
    const productoActual = await Producto.findById(id).populate('categoria', 'familia').lean()
    if (!productoActual || !productoActual.categoria) throw new AppError(404, 'Producto no encontrado')
    validarPrecioPorFamilia((productoActual.categoria as { familia: string }).familia as Familia, datos.precio)
  }
  const producto = await Producto.findByIdAndUpdate(id, datos, { new: true })
  if (!producto) throw new AppError(404, 'Producto no encontrado')
  return producto
}

/**
 * Elimina un producto.
 */
export async function eliminarProducto(id: string) {
  const producto = await Producto.findByIdAndDelete(id)
  if (!producto) throw new AppError(404, 'Producto no encontrado')
}
