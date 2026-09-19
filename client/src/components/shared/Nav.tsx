import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../ui/Button'

export function Nav() {
  const { autenticado, usuario, logout } = useAuth()

  return (
    <header className="border-b border-borde-defecto bg-superficie-base">
      <div className="w-full max-w-contenedor mx-auto px-4 h-16 flex items-center justify-between">
        {/* 32px de alto, por encima del umbral de 120px de ancho donde tocaria el isotipo solo */}
        <Link to="/" aria-label="TaJú — inicio">
          <img src="/brand/taju-imagotipo.svg" alt="TaJú" className="h-8 w-auto" />
        </Link>

        <nav className="flex items-center gap-4">
          <Link to="/catalogo" className="text-sm text-texto-secundario hover:text-texto-principal transition-colors">
            Catálogo
          </Link>
          {autenticado ? (
            <>
              {usuario?.rol === 'administrador' && (
                <>
                  <Link to="/admin" className="text-sm text-texto-secundario hover:text-texto-principal transition-colors">
                    Catálogo (admin)
                  </Link>
                  <Link to="/admin/pedidos" className="text-sm text-texto-secundario hover:text-texto-principal transition-colors">
                    Pedidos (admin)
                  </Link>
                  <Link to="/admin/calendario" className="text-sm text-texto-secundario hover:text-texto-principal transition-colors">
                    Calendario
                  </Link>
                </>
              )}
              {usuario?.rol === 'cliente' && (
                <Link to="/mis-pedidos" className="text-sm text-texto-secundario hover:text-texto-principal transition-colors">
                  Mis pedidos
                </Link>
              )}
              <Button variante="fantasma" tamano="sm" onClick={logout}>
                Salir
              </Button>
            </>
          ) : (
            // Link envolviendo un <button> anida dos controles interactivos - Link estilizado a mano en vez de
            // meter <Button> adentro, asi el DOM tiene un solo elemento interactivo
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 rounded-boton font-medium transition-colors px-3 py-1 text-sm min-h-boton bg-accion text-accion-texto hover:bg-accion-hover active:bg-accion-activo focus-visible:ring-2"
            >
              Ingresar
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
