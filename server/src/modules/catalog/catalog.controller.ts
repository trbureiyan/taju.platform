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

// query param opcional - sin familia trae todo el catalogo activo. Con sesion admin, incluye inactivos
export const listarCategorias = asyncHandler(async (req: Request, res: Response) => {
  const familia = req.query.familia as Familia | undefined
  if (familia && !FAMILIAS.includes(familia)) {
    res.status(400).json({ error: 'Familia inválida' })
    return
  }
  const categorias = await catalogService.listarCategorias(familia, esAdmin(req))
  res.json(categorias)
})

export const obtenerCategoria = asyncHandler(async (req: Request, res: Response) => {
  const categoria = await catalogService.obtenerCategoria(req.params.id, esAdmin(req))
  res.json(categoria)
})

export const crearCategoria = asyncHandler(async (req: Request, res: Response) => {
  const parsed = crearCategoriaSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', detalle: parsed.error.flatten() })
    return
  }
  const categoria = await catalogService.crearCategoria(parsed.data)
  res.status(201).json(categoria)
})

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

export const listarProductos = asyncHandler(async (req: Request, res: Response) => {
  const familia = req.query.familia as Familia | undefined
  const categoriaId = req.query.categoria as string | undefined
  if (familia && !FAMILIAS.includes(familia)) {
    res.status(400).json({ error: 'Familia inválida' })
    return
  }
  const productos = await catalogService.listarProductos(familia, categoriaId, esAdmin(req))
  res.json(productos)
})

export const obtenerProducto = asyncHandler(async (req: Request, res: Response) => {
  const producto = await catalogService.obtenerProducto(req.params.id, esAdmin(req))
  res.json(producto)
})

export const crearProducto = asyncHandler(async (req: Request, res: Response) => {
  const parsed = crearProductoSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', detalle: parsed.error.flatten() })
    return
  }
  const producto = await catalogService.crearProducto(parsed.data)
  res.status(201).json(producto)
})

export const actualizarProducto = asyncHandler(async (req: Request, res: Response) => {
  const parsed = actualizarProductoSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', detalle: parsed.error.flatten() })
    return
  }
  const producto = await catalogService.actualizarProducto(req.params.id, parsed.data)
  res.json(producto)
})

export const eliminarProducto = asyncHandler(async (req: Request, res: Response) => {
  await catalogService.eliminarProducto(req.params.id)
  res.status(204).send()
})
