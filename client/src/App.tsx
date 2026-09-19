import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { Layout } from './components/shared/Layout'
import { ProtectedRoute } from './components/shared/ProtectedRoute'
import { CatalogoPage } from './pages/CatalogoPage'
import { LoginPage } from './pages/LoginPage'
import { RegistrarPage } from './pages/RegistrarPage'
import { ProductoDetailPage } from './pages/ProductoDetailPage'
import { PedidoFormPage } from './pages/PedidoFormPage'
import { MisPedidosPage } from './pages/MisPedidosPage'
import { AdminCatalogoPage } from './pages/admin/AdminCatalogoPage'
import { AdminPedidosPage } from './pages/admin/AdminPedidosPage'
import { AdminCalendarioPage } from './pages/admin/AdminCalendarioPage'

// AuthProvider afuera de BrowserRouter: el estado de sesion no depende de la ruta actual
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            {/* ─── Publicas ─── */}
            {/* no hay landing propia todavia, el catalogo hace de home */}
            <Route path="/" element={<Navigate to="/catalogo" replace />} />
            <Route path="/catalogo" element={<CatalogoPage />} />
            <Route path="/catalogo/:id" element={<ProductoDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/registrar" element={<RegistrarPage />} />

            {/* ─── Cliente autenticado ─── */}
            <Route
              path="/pedido/:productoId"
              element={
                <ProtectedRoute rol="cliente">
                  <PedidoFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mis-pedidos"
              element={
                <ProtectedRoute rol="cliente">
                  <MisPedidosPage />
                </ProtectedRoute>
              }
            />

            {/* ─── Panel de taller (solo administrador) ─── */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute rol="administrador">
                  <AdminCatalogoPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/pedidos"
              element={
                <ProtectedRoute rol="administrador">
                  <AdminPedidosPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/calendario"
              element={
                <ProtectedRoute rol="administrador">
                  <AdminCalendarioPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  )
}
