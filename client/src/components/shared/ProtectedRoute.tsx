import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { RUTA_INICIO_POR_ROL, type Rol } from '../../types'

interface ProtectedRouteProps {
  children: React.ReactNode
  rol?: Rol
}

export function ProtectedRoute({ children, rol }: ProtectedRouteProps) {
  const { autenticado, usuario } = useAuth()

  // sin ?redirect= aqui - a diferencia de ProductoDetailPage, esta redireccion no vuelve a la ruta original
  if (!autenticado) return <Navigate to="/login" replace />
  // logueado pero sin el rol que pide la ruta (ej cliente entrando al panel de admin) - lo mandamos a SU
  // propio inicio, no al catalogo: un administrador nunca deberia terminar en una pagina de cliente
  if (rol && usuario && usuario.rol !== rol) {
    return <Navigate to={RUTA_INICIO_POR_ROL[usuario.rol]} replace />
  }

  return <>{children}</>
}
