import type { Request, Response } from 'express'
import { z } from 'zod'
import * as catalogService from './catalog.service.js'
import { FAMILIAS, type Familia } from '../../types/index.js'
import { asyncHandler } from '../../lib/errors.js'

function esAdmin(req: Request): boolean {
  return req.usuario?.rol === 'administrador'
}

// ─── Categorias ─────────────────────────────────────────────────────────────

const crearCategoriaSchema = z.object({
  nombre: z.string().min(2).max(120),
  descripcion: z.string().max(500).default(''),
  familia: z.enum(FAMILIAS),
  dimensionesBase: z
    .array(z.object({ etiqueta: z.string().min(1), valor: z.number().positive() }))
    .default([]),
})

const actualizarCategoriaSchema = z
  .object({
    nombre: z.string().min(2).max(120).optional(),
    descripcion: z.string().max(500).optional(),
    activo: z.boolean().optional(),
  })
  .strict()

/**
 * Obtiene la lista de categorías. Permite filtrar por familia en query params.
 * Si no es admin, solo devuelve categorías activas.
 */
export const listarCategorias = asyncHandler(async (req: Request, res: Response) => {
  const familia = req.query.familia as Familia | undefined
  if (familia && !FAMILIAS.includes(familia)) {
    res.status(400).json({ error: 'Familia inválida' })
    return
  }
  const categorias = await catalogService.listarCategorias(familia, esAdmin(req))
  res.json(categorias)
})

/**
 * Obtiene una categoría por su ID.
 * Si no es admin y la categoría está inactiva, devuelve 404.
 */
export const obtenerCategoria = asyncHandler(async (req: Request, res: Response) => {
  const categoria = await catalogService.obtenerCategoria(req.params.id, esAdmin(req))
  res.json(categoria)
})

/**
 * Crea una nueva categoría.
 */
export const crearCategoria = asyncHandler(async (req: Request, res: Response) => {
  const parsed = crearCategoriaSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', detalle: parsed.error.flatten() })
    return
  }
  const categoria = await catalogService.crearCategoria(parsed.data)
  res.status(201).json(categoria)
})

/**
 * Actualiza los datos de una categoría. No permite cambiar la familia.
 */
export const actualizarCategoria = asyncHandler(async (req: Request, res: Response) => {
  const parsed = actualizarCategoriaSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', detalle: parsed.error.flatten() })
    return
  }
  const categoria = await catalogService.actualizarCategoria(req.params.id, parsed.data)
  res.json(categoria)
})

// ─── Productos ───────────────────────────────────────────────────────────────

const escalaPrecioSchema = z.object({
  cantidadMinima: z.number().int().positive(),
  precioUnitario: z.number().nonnegative(),
})

const precioSchema = z.object({
  unitario: z.number().nonnegative().nullable().default(null),
  escalas: z.array(escalaPrecioSchema).default([]),
})

// imagenes llega como array de urls ya subidas - este endpoint no maneja el upload en si (ver middleware/upload.ts)
const crearProductoSchema = z.object({
  nombre: z.string().min(2).max(120),
  descripcionTecnica: z.string().max(1000).default(''),
  categoria: z.string().min(1),
  imagenes: z.array(z.string()).default([]),
  especificacionesTecnicas: z.record(z.string()).default({}),
  precio: precioSchema.default({ unitario: null, escalas: [] }),
})

const actualizarProductoSchema = z
  .object({
    nombre: z.string().min(2).max(120).optional(),
    descripcionTecnica: z.string().max(1000).optional(),
    imagenes: z.array(z.string()).optional(),
    especificacionesTecnicas: z.record(z.string()).optional(),
    precio: precioSchema.optional(),
    activo: z.boolean().optional(),
  })
  .strict()

/**
 * Obtiene la lista de productos. Permite filtrar por familia o por categoría en query params.
 * Si no es admin, solo devuelve productos activos y oculta los que pertenecen a categorías inactivas.
 */
export const listarProductos = asyncHandler(async (req: Request, res: Response) => {
  const familia = req.query.familia as Familia | undefined
  const rawCategoria = req.query.categoria
  if (rawCategoria !== undefined && typeof rawCategoria !== 'string') {
    res.status(400).json({ error: 'Formato de categoría inválido' })
    return
  }
  const categoriaId = rawCategoria as string | undefined

  if (familia && !FAMILIAS.includes(familia)) {
    res.status(400).json({ error: 'Familia inválida' })
    return
  }
  const productos = await catalogService.listarProductos(familia, categoriaId, esAdmin(req))
  res.json(productos)
})

/**
 * Obtiene un producto por su ID, incluyendo los datos poblados de su categoría.
 * Si no es admin y el producto o su categoría están inactivos, devuelve 404.
 */
export const obtenerProducto = asyncHandler(async (req: Request, res: Response) => {
  const producto = await catalogService.obtenerProducto(req.params.id, esAdmin(req))
  res.json(producto)
})

/**
 * Crea un nuevo producto.
 */
export const crearProducto = asyncHandler(async (req: Request, res: Response) => {
  const parsed = crearProductoSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', detalle: parsed.error.flatten() })
    return
  }
  const producto = await catalogService.crearProducto(parsed.data)
  res.status(201).json(producto)
})

/**
 * Actualiza los datos de un producto.
 */
export const actualizarProducto = asyncHandler(async (req: Request, res: Response) => {
  const parsed = actualizarProductoSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', detalle: parsed.error.flatten() })
    return
  }
  const producto = await catalogService.actualizarProducto(req.params.id, parsed.data)
  res.json(producto)
})

/**
 * Elimina físicamente un producto.
 */
export const eliminarProducto = asyncHandler(async (req: Request, res: Response) => {
  await catalogService.eliminarProducto(req.params.id)
  res.status(204).send()
})
