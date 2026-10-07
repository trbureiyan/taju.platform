import { lazy, Suspense } from 'react'
import { LazyMotion, MotionConfig } from 'motion/react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { AuthProvider } from './contexts/AuthContext'
import { SnackbarProvider } from './components/ui/Snackbar'
import { Layout } from './components/shared/Layout'
import { ErrorBoundary } from './components/shared/ErrorBoundary'
import { ProtectedRoute } from './components/shared/ProtectedRoute'
import { VitrinaPage } from './pages/VitrinaPage'
import { CatalogoPage } from './pages/CatalogoPage'
import { LoginPage } from './pages/LoginPage'
import { RegistrarPage } from './pages/RegistrarPage'
import { DatosPage } from './pages/DatosPage'
import { PreguntasFrecuentesPage } from './pages/PreguntasFrecuentesPage'
import { ProductoDetailPage } from './pages/ProductoDetailPage'
import { PedidoFormPage } from './pages/PedidoFormPage'
import { MisPedidosPage } from './pages/MisPedidosPage'
import { PedidoDetallePage } from './pages/PedidoDetallePage'
import { NotFoundPage } from './pages/NotFoundPage'
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

// resetKey por ruta: tras un fallo, navegar a otra pantalla vuelve a montar el contenido sin recargar
function ConRedDeSeguridad({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  return <ErrorBoundary resetKey={pathname}>{children}</ErrorBoundary>
}

const cargarFuncionesMovimiento = () => import('./lib/motionFeatures').then((m) => m.default)

// AuthProvider afuera de BrowserRouter: el estado de sesion no depende de la ruta actual
export default function App() {
  return (
    <AuthProvider>
      {/* reducedMotion="user": con la preferencia activa, motion salta al estado final en vez de animar transformaciones */}
      <MotionConfig reducedMotion="user">
        <LazyMotion features={cargarFuncionesMovimiento} strict>
          <BrowserRouter>
            <SnackbarProvider>
            <Layout>
              <ConRedDeSeguridad>
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
                  <Route path="/datos" element={<DatosPage />} />
                  <Route path="/preguntas-frecuentes" element={<PreguntasFrecuentesPage />} />

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
                  <Route
                    path="/mis-pedidos/:id"
                    element={
                      <ProtectedRoute rol="cliente">
                        <PedidoDetallePage />
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
                  {/* siempre al final: lo que no coincide con ninguna ruta de arriba */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
              </ConRedDeSeguridad>
            </Layout>
            </SnackbarProvider>
          </BrowserRouter>
        </LazyMotion>
      </MotionConfig>
      <Analytics />
    </AuthProvider>
  )
}
