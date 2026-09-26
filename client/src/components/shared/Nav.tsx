import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../ui/Button'
import { EnlaceRodante } from './EnlaceRodante'

export function Nav() {
  const { autenticado, usuario, logout } = useAuth()

  return (
    <header className="border-b border-borde-defecto bg-superficie-base">
      <div className="w-full max-w-contenedor mx-auto px-4 min-h-[64px] flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2">
        {/* 32px de alto, por encima del umbral de 120px de ancho donde tocaria el isotipo solo */}
        <Link to="/" aria-label="TaJú — inicio">
          <img src="/brand/taju-imagotipo.svg" alt="TaJú" className="h-8 w-auto" />
        </Link>

        <nav className="flex items-center gap-4">
          <EnlaceRodante to="/catalogo">Catálogo</EnlaceRodante>
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
                <EnlaceRodante to="/mis-pedidos">Mis pedidos</EnlaceRodante>
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
              // secundario: en ninguna pantalla publica iniciar sesion es la accion mas importante, y el amarillo
              // le quitaba el lugar a "Ver el catalogo" o "Enviar mi pedido"
              className="inline-flex items-center justify-center gap-2 rounded-boton font-medium px-3 py-1 text-sm min-h-boton bg-accion-sec-fondo text-accion-sec-texto border border-accion-sec-borde hover:bg-superficie-hundida transition-[background-color,transform] duration-normal ease-estandar active:scale-97"
            >
              Ingresar
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
