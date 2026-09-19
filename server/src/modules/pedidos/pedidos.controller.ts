import type { Request, Response } from 'express'
import { z } from 'zod'
import * as pedidosService from './pedidos.service.js'
import { ESTADOS_PEDIDO } from '../../types/index.js'

// ─── Cliente ──────────────────────────────────────────────────────────────────

const crearPedidoSchema = z.object({
  categoriaId: z.string().min(1, 'Categoría requerida'),
  descripcion: z.string().min(1, 'Describí tu pedido'),
  dimensionValor: z.coerce.number().positive('El valor de dimensión debe ser mayor a 0'),
  esDimensionPersonalizada: z.coerce.boolean(),
  cantidad: z.coerce.number().int().min(1, 'La cantidad mínima es 1'),
  colores: z.string().min(1, 'Indicá los colores'),
  materiales: z.string().min(1, 'Indicá los materiales'),
}) // z.coerce porque llega como multipart/form-data, todo viaja como string hasta aqui

export async function crearPedido(req: Request, res: Response): Promise<void> {
  const parsed = crearPedidoSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos del pedido inválidos', detalles: parsed.error.flatten() })
    return
  }

  const archivos = (req.files as Express.Multer.File[]) ?? [] // uploadImagen ya corrio antes en la ruta

  try {
    // req.usuario! - crearPedido esta detras de requireAuth en la ruta, siempre hay usuario aqui
    const pedido = await pedidosService.crearPedido({
      clienteId: req.usuario!.sub,
      ...parsed.data,
      archivos,
    })
    res.status(201).json(pedido)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al crear el pedido'
    res.status(400).json({ error: msg })
  }
}

export async function getMisPedidos(req: Request, res: Response): Promise<void> {
  try {
    const pedidos = await pedidosService.getMisPedidos(req.usuario!.sub)
    res.json(pedidos)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al obtener pedidos'
    res.status(500).json({ error: msg })
  }
}

export async function getPedidoById(req: Request, res: Response): Promise<void> {
  try {
    const pedido = await pedidosService.getPedidoById(req.params.id, req.usuario!.sub)
    res.json(pedido)
  } catch {
    res.status(404).json({ error: 'Pedido no encontrado' })
  }
}

// ─── Admin ────────────────────────────────────────────────────────────────────

const setFechaEntregaSchema = z.object({
  // nullable a proposito: el admin puede borrar la fecha si todavia no sabe cuando entrega
  fechaEstimadaEntrega: z.string().datetime({ offset: true }).nullable(),
})

export async function setFechaEntrega(req: Request, res: Response): Promise<void> {
  const parsed = setFechaEntregaSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Fecha inválida', detalles: parsed.error.flatten() })
    return
  }

  try {
    const fecha = parsed.data.fechaEstimadaEntrega
      ? new Date(parsed.data.fechaEstimadaEntrega)
      : null
    const pedido = await pedidosService.setFechaEntrega(req.params.id, fecha)
    res.json(pedido)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al actualizar fecha'
    res.status(400).json({ error: msg })
  }
}

export async function getAllPedidos(_req: Request, res: Response): Promise<void> {
  try {
    const pedidos = await pedidosService.getAllPedidos()
    res.json(pedidos)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al obtener pedidos'
    res.status(500).json({ error: msg })
  }
}

const actualizarEstadoSchema = z.object({
  estado: z.enum(ESTADOS_PEDIDO),
})

export async function actualizarEstado(req: Request, res: Response): Promise<void> {
  const parsed = actualizarEstadoSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Estado inválido', detalles: parsed.error.flatten() })
    return
  }

  try {
    const pedido = await pedidosService.updateEstado(
      req.params.id,
      parsed.data.estado,
      req.usuario!.sub,
    )
    res.json(pedido)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al actualizar estado'
    res.status(400).json({ error: msg })
  }
}
