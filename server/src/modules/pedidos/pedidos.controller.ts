import type { Request, Response } from 'express'
import { z } from 'zod'
import * as pedidosService from './pedidos.service.js'
import { ESTADOS_PEDIDO, METODOS_ENTREGA } from '../../types/index.js'
import { asyncHandler } from '../../lib/errors.js'

// ─── Cliente ──────────────────────────────────────────────────────────────────

// multipart/form-data manda todo como string - z.coerce.boolean() usa Boolean(valor) y por eso
// 'false' (string no vacio) da true. z.enum sobre los dos literales exactos evita esa trampa
const booleanoTexto = z.enum(['true', 'false']).transform((v) => v === 'true')

const crearPedidoSchema = z.object({
  productoId: z.string().min(1, 'Producto requerido'),
  categoriaId: z.string().min(1, 'Categoría requerida'),
  descripcion: z
    .string()
    .min(1, 'Cuéntanos qué necesitas. Con eso podemos cotizarlo.')
    .max(500, 'La descripción admite hasta 500 caracteres. Deja lo esencial y el resto lo hablamos por WhatsApp.'),
  dimensionValor: z.coerce.number().positive('El valor de dimensión debe ser mayor a 0'),
  esDimensionPersonalizada: booleanoTexto,
  cantidad: z.coerce.number().int().min(1, 'La cantidad mínima es 1'),
  colores: z.string().min(1, 'Indica los colores que quieres'),
  materiales: z.string().min(1, 'Indica el material o para qué lo usarás'),
  telefono: z
    .string()
    .trim()
    .regex(/^3\d{9}$/, 'Escribe tu celular de 10 dígitos, empieza en 3. Es el número por el que te escribimos.'),
  entregaMetodo: z.enum(METODOS_ENTREGA),
  entregaDetalle: z.string().trim().max(200).default(''),
  // nullable a proposito: la exigencia de fecha la decide pedidos.requisitos.ts segun la familia
  fechaDeseada: z.string().datetime({ offset: true }).nullable().default(null),
})

export const crearPedido = asyncHandler(async (req: Request, res: Response) => {
  const parsed = crearPedidoSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos del pedido inválidos', detalles: z.flattenError(parsed.error) })
    return
  }

  const archivos = (req.files as Express.Multer.File[]) ?? [] // uploadImagen ya corrio antes en la ruta

  // req.usuario! - crearPedido esta detras de requireAuth en la ruta, siempre hay usuario aqui
  const pedido = await pedidosService.crearPedido({
    clienteId: req.usuario!.sub,
    ...parsed.data,
    fechaDeseada: parsed.data.fechaDeseada ? new Date(parsed.data.fechaDeseada) : null,
    archivos,
  })
  res.status(201).json(pedido)
})

export const getMisPedidos = asyncHandler(async (req: Request, res: Response) => {
  const pedidos = await pedidosService.getMisPedidos(req.usuario!.sub)
  res.json(pedidos)
})

export const getPedidoById = asyncHandler(async (req: Request, res: Response) => {
  const pedido = await pedidosService.getPedidoById(req.params.id, req.usuario!.sub)
  res.json(pedido)
})

// ─── Admin ────────────────────────────────────────────────────────────────────

const setFechaEntregaSchema = z.object({
  // nullable a proposito: el admin puede borrar la fecha si todavia no sabe cuando entrega
  fechaEntrega: z.string().datetime({ offset: true }).nullable(),
})

export const setFechaEntrega = asyncHandler(async (req: Request, res: Response) => {
  const parsed = setFechaEntregaSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Fecha inválida', detalles: z.flattenError(parsed.error) })
    return
  }

  const fecha = parsed.data.fechaEntrega ? new Date(parsed.data.fechaEntrega) : null
  const pedido = await pedidosService.setFechaEntrega(req.params.id, fecha)
  res.json(pedido)
})

/**
 * GET /api/pedidos — panel de taller (requiere rol administrador).
 * Query params opcionales: ?limite=N (entero positivo, default 50, max 100) y ?pagina=N (entero positivo, default 1).
 * Valores no enteros o negativos se ignoran y se usan los defaults.
 */
export const getAllPedidos = asyncHandler(async (req: Request, res: Response) => {
  // parseInt rechaza floats y strings con letras; typeof protege contra arrays de query (?limite=1&limite=2)
  const limiteRaw = typeof req.query.limite === 'string' ? parseInt(req.query.limite, 10) : NaN
  const paginaRaw = typeof req.query.pagina === 'string' ? parseInt(req.query.pagina, 10) : NaN
  const limite = Number.isInteger(limiteRaw) && limiteRaw > 0 ? limiteRaw : 50
  const pagina = Number.isInteger(paginaRaw) && paginaRaw > 0 ? paginaRaw : 1
  // (pagina - 1) * limite puede desbordar Number.MAX_SAFE_INTEGER con valores extremos
  if (!Number.isSafeInteger((pagina - 1) * limite)) {
    res.json([])
    return
  }
  const pedidos = await pedidosService.getAllPedidos(limite, pagina)
  res.json(pedidos)
})

const actualizarEstadoSchema = z.object({
  estado: z.enum(ESTADOS_PEDIDO),
  confirmarDimensionPersonalizada: z.boolean().default(false),
})

export const actualizarEstado = asyncHandler(async (req: Request, res: Response) => {
  const parsed = actualizarEstadoSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Estado inválido', detalles: z.flattenError(parsed.error) })
    return
  }

  const pedido = await pedidosService.updateEstado(
    req.params.id,
    parsed.data.estado,
    req.usuario!.sub,
    parsed.data.confirmarDimensionPersonalizada,
  )
  res.json(pedido)
})
