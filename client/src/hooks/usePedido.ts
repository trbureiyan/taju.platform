import { useEffect, useState, useCallback } from 'react'
import { api, ErrorApi, getToken } from '../lib/api'
import { actualizarEnMemoria } from './useMisPedidos'
import { useAuth } from '../contexts/AuthContext'
import type { Pedido } from '../types'

type Estado = 'cargando' | 'listo' | 'no-encontrado' | 'error'

/**
 * Carga un pedido por id. Si ya está en la lista de esta sesión, se muestra de inmediato y se refresca en segundo plano.
 * Montar con key={id}: cambiar de pedido reinicia el estado sin setState dentro del efecto.
 * @param id - Id del pedido.
 * @param inicial - Pedido de la lista en memoria de esta sesión (`pedidoEnMemoria`), si existe.
 * @returns pedido, estado ('cargando' | 'listo' | 'no-encontrado' | 'error') y reintentar() y reemplazar(p).
 */
export function usePedido(id: string, inicial?: Pedido) {
  useAuth()
  const token = getToken()
  const [pedido, setPedido] = useState<Pedido | null>(inicial ?? null)
  const [estado, setEstado] = useState<Estado>(inicial ? 'listo' : 'cargando')
  const [tokenMostrado, setTokenMostrado] = useState(token)
  const [intento, setIntento] = useState(0)

  if (tokenMostrado !== token) {
    setTokenMostrado(token)
    setPedido(null)
    setEstado('cargando')
  }

  useEffect(() => {
    let cancelado = false
    api
      .get<Pedido>(`/pedidos/${id}`)
      .then((p) => {
        if (cancelado) return
        setPedido(p)
        setEstado('listo')
      })
      .catch((err: unknown) => {
        if (cancelado) return
        // el server no distingue inexistente de ajeno - ambos dan 404 (ver getPedidoById)
        if (err instanceof ErrorApi && err.estado === 404) return setEstado('no-encontrado')
        setEstado((actual) => (actual === 'listo' ? 'listo' : 'error'))
      })
    return () => {
      cancelado = true
    }
  }, [id, intento, token])

  const reintentar = useCallback(() => {
    setEstado('cargando')
    setIntento((n) => n + 1)
  }, [])

  // el PATCH de cancelar ya devuelve el pedido actualizado: se pinta sin volver a pedirlo ni parpadear
  const reemplazar = useCallback((actualizado: Pedido) => {
    setPedido(actualizado)
    setEstado('listo')
    actualizarEnMemoria(actualizado)
  }, [])

  return { pedido, estado, reintentar, reemplazar }
}
