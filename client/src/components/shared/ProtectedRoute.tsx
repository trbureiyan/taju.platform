import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import type { Rol } from '../../types'

interface ProtectedRouteProps {
  children: React.ReactNode
  rol?: Rol
}

export function ProtectedRoute({ children, rol }: ProtectedRouteProps) {
  const { autenticado, usuario } = useAuth()

  // sin ?redirect= aqui - a diferencia de ProductoDetailPage, esta redireccion no vuelve a la ruta original
  if (!autenticado) return <Navigate to="/login" replace />
  // logueado pero sin el rol que pide la ruta (ej cliente entrando al panel de admin) - no error, solo lo mandamos al catalogo
  if (rol && usuario?.rol !== rol) return <Navigate to="/catalogo" replace />

  return <>{children}</>
}
