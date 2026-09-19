import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { api, setToken } from '../lib/api'
import type { Usuario } from '../types'

interface AuthState {
  usuario: Usuario | null
  autenticado: boolean
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>
  registrar: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

// login y registrar devuelven la misma forma - un token nuevo mas el usuario recien autenticado
interface LoginResponse {
  token: string
  usuario: Usuario
}

// ─── Provider ─────────────────────────────────────────────────────────────────

// nada de rehidratar sesion al montar: si recargas la pagina, se pierde la sesion, es la decision de diseño
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ usuario: null, autenticado: false })

  // useCallback: el value del provider incluye estas funciones, sin memo cada render de AuthProvider
  // generaria funciones nuevas y volveria a renderizar todo lo que consume useAuth() por nada
  const login = useCallback(async (email: string, password: string) => {
    const { token, usuario } = await api.post<LoginResponse>('/auth/login', { email, password })
    setToken(token) // token va al modulo api.ts, usuario al estado de react - dos lugares distintos a proposito
    setState({ usuario, autenticado: true })
  }, [])

  // login y registrar terminan igual (token + usuario autenticado), solo cambia el endpoint que golpean
  const registrar = useCallback(async (email: string, password: string) => {
    const { token, usuario } = await api.post<LoginResponse>('/auth/registrar', { email, password })
    setToken(token)
    setState({ usuario, autenticado: true })
  }, [])

  // no hay endpoint de logout en el server - el token es stateless, "cerrar sesion" es solo olvidarlo aca
  const logout = useCallback(() => {
    setToken(null)
    setState({ usuario: null, autenticado: false })
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, registrar, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hook de consumo ──────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
