import { useState, useEffect, useCallback } from 'react'
import { api, getToken } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { normalizarPedido } from '../lib/pedido'
import type { Pedido } from '../types'

interface Estado {
  pedidos: Pedido[]
  cargando: boolean
  error: string | null
}

// [!] atado al token igual que useCatalogo: al cerrar sesion, la lista de pedidos de un cliente no
// puede quedar a la vista de quien entra despues en el mismo navegador
let cache: { token: string | null; pedidos: Pedido[] } | null = null

/** Olvida la lista en memoria. Para tests: cada uno arranca sin estado compartido. */
export function olvidarMisPedidos() {
  cache = null
}

/**
 * Pedido en memoria de esta sesión, solo si ya lo trajo `useMisPedidos`.
 * El detalle lo usa para pintar al instante, misma regla que `productoEnCatalogo`.
 * @param id - Id del pedido.
 * @returns El pedido, o undefined si no está en la lista de esta sesión.
 */
export function pedidoEnMemoria(id: string): Pedido | undefined {
  if (!cache || cache.token !== getToken()) return undefined
  return cache.pedidos.find((p) => p._id === id)
}

/**
 * Cambia un pedido en la lista en memoria (p. ej. tras cancelarlo) para que Mis pedidos y el detalle
 * no pinten el estado viejo. No hace nada si la sesión cambió o el pedido no está en la lista.
 * @param actualizado - Pedido tal como lo devolvió el server.
 */
export function actualizarEnMemoria(actualizado: Pedido) {
  if (!cache || cache.token !== getToken()) return
  cache = { ...cache, pedidos: cache.pedidos.map((p) => (p._id === actualizado._id ? actualizado : p)) }
}

function estadoInicial(token: string | null): Estado {
  return cache && cache.token === token
    ? { pedidos: cache.pedidos, cargando: false, error: null }
    : { pedidos: [], cargando: true, error: null }
}

/**
 * Carga los pedidos del cliente autenticado.
 * @returns pedidos, cargando, error (mensaje o null) y reintentar(), que vuelve a pedir sin recargar la página.
 */
export function useMisPedidos() {
  useAuth()
  const token = getToken()
  const [estado, setEstado] = useState<Estado>(() => estadoInicial(token))
  const [tokenMostrado, setTokenMostrado] = useState(token)
  const [intento, setIntento] = useState(0)

  if (tokenMostrado !== token) {
    setTokenMostrado(token)
    setEstado(estadoInicial(token))
  }

  useEffect(() => {
    let cancelado = false
    api
      .get<Pedido[]>('/pedidos/mis-pedidos')
      .then((crudos) => {
        const pedidos = crudos.map(normalizarPedido)
        if (getToken() === token) cache = { token, pedidos }
        if (!cancelado) setEstado({ pedidos, cargando: false, error: null })
      })
      .catch((err: Error) => {
        if (cancelado) return
        if (cache?.token === token) setEstado({ pedidos: cache.pedidos, cargando: false, error: null })
        else setEstado({ pedidos: [], cargando: false, error: err.message })
      })
    return () => {
      cancelado = true
    }
  }, [intento, token])

  const reintentar = useCallback(() => {
    setEstado((prev) => ({ ...prev, cargando: true, error: null }))
    setIntento((n) => n + 1)
  }, [])

  return { ...estado, reintentar }
}
