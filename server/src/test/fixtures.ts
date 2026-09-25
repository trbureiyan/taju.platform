import { Types } from 'mongoose'
import { Categoria } from '../models/Categoria.js'
import { Producto } from '../models/Producto.js'
import { Usuario } from '../models/Usuario.js'

/** Crea categoria + producto activos y un cliente, lo minimo que crearPedido necesita para no rechazar. */
export async function crearCatalogoYCliente() {
  const categoria = await Categoria.create({ nombre: 'Toppers de acrílico', familia: 'toppers' })
  const producto = await Producto.create({
    nombre: 'Topper nombre en espejo dorado',
    categoria: categoria._id,
    precio: { unitario: 35000, escalas: [] },
  })
  const cliente = await Usuario.create({
    nombre: 'Laura',
    email: `laura-${new Types.ObjectId().toString()}@taju.co`,
    password: 'hash-no-relevante',
  })
  return { categoria, producto, cliente }
}

/** Payload base de creacion; cada test pisa solo lo que le importa. */
export function inputPedido(ids: { clienteId: string; productoId: string; categoriaId: string }) {
  return {
    ...ids,
    descripcion: 'Topper "Feliz 15 Valentina" para torta de media libra',
    dimensionValor: 22,
    esDimensionPersonalizada: false,
    cantidad: 1,
    colores: 'dorado',
    materiales: 'acrílico espejo 3 mm',
    fechaEntrega: new Date('2026-12-12T17:00:00.000Z') as Date | null,
    archivos: [] as Express.Multer.File[],
  }
}
