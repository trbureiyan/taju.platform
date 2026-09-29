import type { Request, Response } from 'express'
import { z } from 'zod'
import * as pedidosService from './pedidos.service.js'
import { ESTADOS_PEDIDO, MEDIOS_PAGO, METODOS_ENTREGA } from '../../types/index.js'
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
  entregaMetodo: z.enum(METODOS_ENTREGA, {
    error: 'No sabemos cómo quieres recibir tu pedido. Elige si lo vas a recoger en el taller o te lo llevamos a domicilio.',
  }),
  entregaDetalle: z
    .string()
    .trim()
    .max(200, 'La dirección admite hasta 200 caracteres. Deja la calle, el número y el barrio; el resto lo hablamos por WhatsApp.')
    .default(''),
  // nullable a proposito: la exigencia de fecha la decide pedidos.requisitos.ts segun la familia
  fechaDeseada: z.string().datetime({ offset: true }).nullable().default(null),
})

export const crearPedido = asyncHandler(async (req: Request, res: Response) => {
  const parsed = crearPedidoSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos del pedido inválidos', detalles: z.flattenError(parsed.error) })
    return
  }

  // uploadImagen (.array) ya corrio antes en la ruta; Array.isArray descarta la forma de objeto que multer usa con .fields()
  const archivos = Array.isArray(req.files) ? req.files : []

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

export const cancelarMiPedido = asyncHandler(async (req: Request, res: Response) => {
  const pedido = await pedidosService.cancelarMiPedido(req.params.id, req.usuario!.sub)
  res.json(pedido)
})

// ─── Admin ────────────────────────────────────────────────────────────────────

const acuerdoSchema = z
  .object({
    // nullable: el taller puede borrar la fecha acordada si el cliente la mueve
    fechaEntrega: z.string().datetime({ offset: true }).nullable().optional(),
    entrega: z
      .object({ metodo: z.enum(METODOS_ENTREGA), detalle: z.string().trim().max(200).default('') })
      .optional(),
    pago: z.object({ monto: z.number().int().positive(), medio: z.enum(MEDIOS_PAGO) }).optional(),
  })
  .refine((v) => v.fechaEntrega !== undefined || v.entrega !== undefined || v.pago !== undefined, {
    message: 'No hay nada que guardar',
  })

export const registrarAcuerdo = asyncHandler(async (req: Request, res: Response) => {
  const parsed = acuerdoSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Acuerdo inválido', detalles: z.flattenError(parsed.error) })
    return
  }
  const { fechaEntrega, entrega, pago } = parsed.data
  const pedido = await pedidosService.registrarAcuerdo(req.params.id, {
    ...(fechaEntrega !== undefined && { fechaEntrega: fechaEntrega ? new Date(fechaEntrega) : null }),
    ...(entrega && { entrega }),
    ...(pago && { pago }),
  })
  res.json(pedido)
})

export const marcarContactado = asyncHandler(async (req: Request, res: Response) => {
  const pedido = await pedidosService.marcarContactado(req.params.id, req.usuario!.sub)
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
