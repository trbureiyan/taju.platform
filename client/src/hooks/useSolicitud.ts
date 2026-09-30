import { useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { mensajeDeErrorDeEnvio } from '../lib/errorEnvio'
import { normalizarCelular } from '../lib/requisitos'
import {
  CAMPOS_INICIALES,
  esMedidaPersonalizada,
  validarMomento,
  type Campos,
  type Errores,
} from '../lib/validarSolicitud'
import type { Pedido, Producto } from '../types'

const TOTAL_MOMENTOS = 4

// borra la clave en vez de dejarla en undefined: Object.keys(errores) cuenta solo errores reales
function sinClave(errores: Errores, campo: keyof Errores): Errores {
  const resto = { ...errores }
  delete resto[campo]
  return resto
}

// hora de Colombia fija (-05:00, sin horario de verano): la fecha pedida no depende de la zona del dispositivo
function instanteDeseado(fecha: string, hora: string): string {
  return new Date(`${fecha}T${hora}:00-05:00`).toISOString()
}

/**
 * Estado, validacion por momento y envio del formulario de solicitud. Vive en el padre y en memoria (sin
 * localStorage): cambiar de momento no pierde nada. El momento actual se lee de `?paso=` para que Atras del
 * navegador cambie de momento en vez de sacar al cliente del formulario.
 * @param producto - Producto sobre el que se pide; null mientras carga.
 */
export function useSolicitud(producto: Producto | null) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [campos, setCampos] = useState<Campos>(CAMPOS_INICIALES)
  const [archivos, setArchivos] = useState<File[]>([])
  const [errores, setErrores] = useState<Errores>({})
  // ultimo momento ya validado: no se puede saltar por URL mas alla del siguiente
  const [validadoHasta, setValidadoHasta] = useState(0)
  const [enviando, setEnviando] = useState(false)
  const enviandoRef = useRef(false)
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null)
  const [fallos, setFallos] = useState(0)

  const pedido = Number(searchParams.get('paso'))
  const pedidoValido = Number.isInteger(pedido) && pedido >= 1 ? pedido : 1
  const paso = Math.min(pedidoValido, TOTAL_MOMENTOS, validadoHasta + 1)

  const esDimensionPersonalizada = producto ? esMedidaPersonalizada(campos.dimensionSeleccionada, producto) : false

  function irAlPaso(destino: number) {
    setSearchParams((prev) => {
      const siguiente = new URLSearchParams(prev)
      siguiente.set('paso', String(destino))
      return siguiente
    })
  }

  // limpia el error del campo apenas el usuario vuelve a escribir en el, no espera al proximo intento
  function set(campo: keyof Campos, valor: string) {
    setCampos((prev) => ({ ...prev, [campo]: valor }))
    if (errores[campo]) setErrores((prev) => sinClave(prev, campo))
  }

  function precargar(parcial: Partial<Campos>) {
    setCampos((prev) => ({ ...prev, ...parcial }))
  }

  function cambiarArchivos(nuevos: File[]) {
    setArchivos(nuevos)
    if (errores.archivos) setErrores((prev) => sinClave(prev, 'archivos'))
  }

  function siguiente(): boolean {
    if (!producto || paso > 3) return false
    const encontrados = validarMomento(paso as 1 | 2 | 3, campos, archivos, producto, new Date())
    setErrores(encontrados)
    if (Object.keys(encontrados).length > 0) {
      setFallos((n) => n + 1)
      return false
    }
    setValidadoHasta((v) => Math.max(v, paso))
    irAlPaso(paso + 1)
    return true
  }

  function atras() {
    if (paso > 1) irAlPaso(paso - 1)
  }

  /** Valida los tres momentos y, si todo esta bien, envia. Devuelve el pedido creado, o null si no se envio. */
  async function enviar(): Promise<Pedido | null> {
    if (!producto || enviandoRef.current) return null
    const ahora = new Date()
    for (const numero of [1, 2, 3] as const) {
      const encontrados = validarMomento(numero, campos, archivos, producto, ahora)
      if (Object.keys(encontrados).length > 0) {
        setErrores(encontrados)
        setFallos((n) => n + 1)
        // enviar valido los momentos anteriores: sin esto el tope de la URL deja al cliente atras de sus errores
        setValidadoHasta((v) => Math.max(v, numero - 1))
        irAlPaso(numero)
        return null
      }
    }

    enviandoRef.current = true
    setEnviando(true)
    setErrorEnvio(null)

    try {
      // armar la solicitud va dentro del try: si algo aqui lanza, el finally igual libera el formulario
      return await api.postForm<Pedido>('/pedidos', armarSolicitud(producto))
    } catch (err) {
      setErrorEnvio(mensajeDeErrorDeEnvio(err))
      return null
    } finally {
      enviandoRef.current = false
      setEnviando(false)
    }
  }

  // FormData porque van archivos - api.post normal serializa a JSON y no sirve aqui
  function armarSolicitud(producto: Producto): FormData {
    // si eligio una dimension base, mandamos su valor numerico; si no, el que escribio a mano
    let dimensionValor: number
    if (esDimensionPersonalizada) {
      dimensionValor = parseFloat(campos.dimensionCustom)
    } else {
      const base = producto.categoria.dimensionesBase.find((d) => d.etiqueta === campos.dimensionSeleccionada)
      dimensionValor = base?.valor ?? 0
    }

    const fd = new FormData()
    fd.append('productoId', producto._id)
    fd.append('categoriaId', producto.categoria._id)
    fd.append('descripcion', campos.descripcion)
    fd.append('dimensionValor', String(dimensionValor))
    fd.append('esDimensionPersonalizada', String(esDimensionPersonalizada))
    fd.append('cantidad', campos.cantidad)
    fd.append('colores', campos.colores)
    fd.append('materiales', campos.materiales)
    fd.append('telefono', normalizarCelular(campos.telefono))
    fd.append('entregaMetodo', campos.entregaMetodo)
    // la direccion escrita antes de volver a "recoger" no debe llegar al pedido ni a la clave de idempotencia
    fd.append('entregaDetalle', campos.entregaMetodo === 'domicilio' ? campos.entregaDetalle : '')
    fd.append('fechaDeseada', instanteDeseado(campos.fechaDeseada, campos.horaDeseada))
    archivos.forEach((f) => fd.append('imagenes', f))
    return fd
  }

  return {
    campos,
    set,
    precargar,
    archivos,
    cambiarArchivos,
    errores,
    paso,
    siguiente,
    atras,
    irAlPaso,
    enviar,
    enviando,
    errorEnvio,
    fallos,
    esDimensionPersonalizada,
  }
}
