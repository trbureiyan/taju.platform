import type { Pedido, Producto } from '../types'
import { fechaConHora } from './pedido'
import { fechaEnPalabras, horaEnPalabras } from './horario'
import { normalizarCelular } from './requisitos'
import { esMedidaPersonalizada } from './validarSolicitud'

/** Una linea del resumen. `valor: null` es "pendiente": el cliente todavia no lo responde. */
export interface LineaResumen {
  clave: string
  etiqueta: string
  valor: string | null
}

export interface CamposResumen {
  dimensionSeleccionada: string
  dimensionCustom: string
  cantidad: string
  colores: string
  materiales: string
  descripcion: string
  entregaMetodo: string
  entregaDetalle: string
  fechaDeseada: string
  horaDeseada: string
  telefono: string
}

const texto = (valor: string): string | null => (valor.trim() ? valor.trim() : null)

function celular(digitos: string): string | null {
  const d = normalizarCelular(digitos)
  return d.length === 10 ? `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}` : null
}

function entrega(metodo: string, detalle: string): string {
  return metodo === 'domicilio' ? `a domicilio${detalle.trim() ? ` (${detalle.trim()})` : ''}` : 'la recojo en el taller'
}

function referencias(cantidad: number, obligatoria: boolean): string | null {
  if (cantidad === 0) return obligatoria ? null : 'Sin imágenes'
  return cantidad === 1 ? '1 imagen' : `${cantidad} imágenes`
}

/**
 * Resumen mientras el cliente llena el formulario. Es la MISMA forma que el mensaje de WhatsApp y la pantalla de
 * exito (resumenDesdePedido): el cliente ve tres veces lo mismo y entiende que eso es lo que envio.
 */
export function resumenDesdeCampos(
  campos: CamposResumen,
  producto: Producto,
  refs: { cantidad: number; obligatoria: boolean },
): LineaResumen[] {
  const base = producto.categoria.dimensionesBase.find((d) => d.etiqueta === campos.dimensionSeleccionada)
  let medida: string | null = null
  if (esMedidaPersonalizada(campos.dimensionSeleccionada, producto)) {
    medida = texto(campos.dimensionCustom) ? `${campos.dimensionCustom.trim()} cm (personalizada)` : null
  } else if (base) {
    medida = `${base.valor} ${base.unidad}`
  }
  // con el dia elegido la hoja ya lo muestra; la hora que falta se dice en la misma linea
  let fecha: string | null = null
  if (campos.fechaDeseada) {
    const hora = campos.horaDeseada ? horaEnPalabras(Number(campos.horaDeseada.slice(0, 2))) : 'hora pendiente'
    fecha = `${fechaEnPalabras(campos.fechaDeseada)}, ${hora}`
  }

  return [
    { clave: 'producto', etiqueta: 'Producto', valor: producto.nombre },
    { clave: 'medida', etiqueta: 'Medida', valor: medida },
    { clave: 'cantidad', etiqueta: 'Cantidad', valor: texto(campos.cantidad) },
    { clave: 'colores', etiqueta: 'Colores', valor: texto(campos.colores) },
    { clave: 'materiales', etiqueta: 'Materiales', valor: texto(campos.materiales) },
    { clave: 'referencias', etiqueta: 'Referencias', valor: referencias(refs.cantidad, refs.obligatoria) },
    { clave: 'entrega', etiqueta: 'Entrega', valor: entrega(campos.entregaMetodo, campos.entregaDetalle) },
    { clave: 'fecha', etiqueta: 'Fecha deseada', valor: fecha },
    { clave: 'celular', etiqueta: 'Celular', valor: celular(campos.telefono) },
    { clave: 'descripcion', etiqueta: 'Descripción', valor: texto(campos.descripcion) },
  ]
}

/** Resumen de una solicitud ya creada. Solo la fecha puede quedar pendiente (solicitudes viejas sin fecha). */
export function resumenDesdePedido(p: Pedido): LineaResumen[] {
  return [
    { clave: 'producto', etiqueta: 'Producto', valor: p.producto.nombre },
    {
      clave: 'medida',
      etiqueta: 'Medida',
      valor: `${p.dimensiones.valor} ${p.dimensiones.unidad}${p.dimensiones.esDimensionPersonalizada ? ' (personalizada)' : ''}`,
    },
    { clave: 'cantidad', etiqueta: 'Cantidad', valor: String(p.cantidad) },
    { clave: 'colores', etiqueta: 'Colores', valor: p.colores },
    { clave: 'materiales', etiqueta: 'Materiales', valor: p.materiales },
    { clave: 'referencias', etiqueta: 'Referencias', valor: referencias(p.imagenesReferencia.length, false) },
    { clave: 'entrega', etiqueta: 'Entrega', valor: entrega(p.entrega.metodo, p.entrega.detalle) },
    { clave: 'fecha', etiqueta: 'Fecha deseada', valor: p.fechaDeseada ? fechaConHora(p.fechaDeseada) : null },
    { clave: 'celular', etiqueta: 'Celular', valor: celular(p.contacto.telefono) },
    { clave: 'descripcion', etiqueta: 'Descripción', valor: p.descripcion },
  ]
}
