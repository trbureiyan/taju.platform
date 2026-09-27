import type { Producto, Familia, Precio } from '../types'

// fabrica de productos de prueba: solo lo que cada test cambia, el resto con valores neutros
export function producto(parcial: {
  _id?: string
  nombre?: string
  familia?: Familia
  categoria?: string
  precio?: Precio
  especificaciones?: Record<string, string>
  imagenes?: string[]
}): Producto {
  return {
    _id: parcial._id ?? parcial.nombre ?? 'p',
    nombre: parcial.nombre ?? 'Producto',
    descripcionTecnica: 'Descripcion',
    categoria: {
      _id: 'c',
      nombre: parcial.categoria ?? 'Categoria',
      familia: parcial.familia ?? 'toppers',
      dimensionesBase: [],
    },
    especificacionesTecnicas: parcial.especificaciones ?? {},
    imagenes: parcial.imagenes ?? [],
    precio: parcial.precio ?? { unitario: 10000, escalas: [] },
    activo: true,
  }
}
