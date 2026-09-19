import type { Request, Response } from 'express'
import { z } from 'zod'
import * as catalogService from './catalog.service.js'
import { FAMILIAS, type Familia } from '../../types/index.js'

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

// query param opcional - sin familia trae todo el catalogo activo
export async function listarCategorias(req: Request, res: Response): Promise<void> {
  const familia = req.query.familia as Familia | undefined
  if (familia && !FAMILIAS.includes(familia)) {
    res.status(400).json({ error: 'Familia inválida' })
    return
  }
  const categorias = await catalogService.listarCategorias(familia)
  res.json(categorias)
}

export async function obtenerCategoria(req: Request, res: Response): Promise<void> {
  try {
    const categoria = await catalogService.obtenerCategoria(req.params.id)
    res.json(categoria)
  } catch {
    res.status(404).json({ error: 'Categoría no encontrada' })
  }
}

export async function crearCategoria(req: Request, res: Response): Promise<void> {
  const parsed = crearCategoriaSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', detalle: parsed.error.flatten() })
    return
  }
  const categoria = await catalogService.crearCategoria(parsed.data)
  res.status(201).json(categoria)
}

export async function actualizarCategoria(req: Request, res: Response): Promise<void> {
  const parsed = actualizarCategoriaSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', detalle: parsed.error.flatten() })
    return
  }
  try {
    const categoria = await catalogService.actualizarCategoria(req.params.id, parsed.data)
    res.json(categoria)
  } catch {
    res.status(404).json({ error: 'Categoría no encontrada' })
  }
}

// ─── Productos ───────────────────────────────────────────────────────────────

// imagenes llega como array de urls ya subidas - este endpoint no maneja el upload en si (ver middleware/upload.ts)
const crearProductoSchema = z.object({
  nombre: z.string().min(2).max(120),
  descripcionTecnica: z.string().max(1000).default(''),
  categoria: z.string().min(1),
  imagenes: z.array(z.string()).default([]),
})

const actualizarProductoSchema = z
  .object({
    nombre: z.string().min(2).max(120).optional(),
    descripcionTecnica: z.string().max(1000).optional(),
    imagenes: z.array(z.string()).optional(),
    activo: z.boolean().optional(),
  })
  .strict()

export async function listarProductos(req: Request, res: Response): Promise<void> {
  const familia = req.query.familia as Familia | undefined
  const categoriaId = req.query.categoria as string | undefined
  if (familia && !FAMILIAS.includes(familia)) {
    res.status(400).json({ error: 'Familia inválida' })
    return
  }
  const productos = await catalogService.listarProductos(familia, categoriaId)
  res.json(productos)
}

export async function obtenerProducto(req: Request, res: Response): Promise<void> {
  try {
    const producto = await catalogService.obtenerProducto(req.params.id)
    res.json(producto)
  } catch {
    res.status(404).json({ error: 'Producto no encontrado' })
  }
}

export async function crearProducto(req: Request, res: Response): Promise<void> {
  const parsed = crearProductoSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', detalle: parsed.error.flatten() })
    return
  }
  try {
    const producto = await catalogService.crearProducto(parsed.data)
    res.status(201).json(producto)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al crear el producto'
    res.status(400).json({ error: message })
  }
}

export async function actualizarProducto(req: Request, res: Response): Promise<void> {
  const parsed = actualizarProductoSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', detalle: parsed.error.flatten() })
    return
  }
  try {
    const producto = await catalogService.actualizarProducto(req.params.id, parsed.data)
    res.json(producto)
  } catch {
    res.status(404).json({ error: 'Producto no encontrado' })
  }
}
