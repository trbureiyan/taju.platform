import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { Layout } from './components/shared/Layout'
import { ProtectedRoute } from './components/shared/ProtectedRoute'
import { VitrinaPage } from './pages/VitrinaPage'
import { CatalogoPage } from './pages/CatalogoPage'
import { LoginPage } from './pages/LoginPage'
import { RegistrarPage } from './pages/RegistrarPage'
import { ProductoDetailPage } from './pages/ProductoDetailPage'
import { PedidoFormPage } from './pages/PedidoFormPage'
import { MisPedidosPage } from './pages/MisPedidosPage'
import { EsperaTaller } from './components/shared/EsperaTaller'

// el panel de taller no viaja en la primera carga: ningun cliente lo abre y la Vitrina es la puerta de entrada
const AdminCatalogoPage = lazy(() =>
  import('./pages/admin/AdminCatalogoPage').then((m) => ({ default: m.AdminCatalogoPage }))
)
const AdminPedidosPage = lazy(() =>
  import('./pages/admin/AdminPedidosPage').then((m) => ({ default: m.AdminPedidosPage }))
)
const AdminCalendarioPage = lazy(() =>
  import('./pages/admin/AdminCalendarioPage').then((m) => ({ default: m.AdminCalendarioPage }))
)

// AuthProvider afuera de BrowserRouter: el estado de sesion no depende de la ruta actual
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Suspense
            fallback={
              <EsperaTaller
                mensaje="Estamos abriendo el panel"
                mensajeLargo="Estamos abriendo el panel. Tarda un poco más la primera vez."
              />
            }
          >
            <Routes>
              {/* ─── Publicas ─── */}
              <Route path="/" element={<VitrinaPage />} />
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
          </Suspense>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  )
}
