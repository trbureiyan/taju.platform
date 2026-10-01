import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  // al cambiar (la ruta actual) el aviso se descarta y se vuelve a intentar pintar
  resetKey: string
  children: ReactNode
}

interface Estado {
  fallo: boolean
}

/**
 * Red de seguridad del arbol: sin ella un error al renderizar desmonta toda la app y queda la pantalla en blanco
 * (tambien pasa cuando un chunk `lazy` ya no existe tras un despliegue). Dice que paso y da salidas.
 */
export class ErrorBoundary extends Component<Props, Estado> {
  state: Estado = { fallo: false }

  static getDerivedStateFromError(): Estado {
    return { fallo: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // el unico rastro que queda del fallo: consola del navegador
    console.error('Error al renderizar', error, info.componentStack)
  }

  componentDidUpdate(anterior: Props) {
    if (this.state.fallo && anterior.resetKey !== this.props.resetKey) this.setState({ fallo: false })
  }

  render() {
    if (!this.state.fallo) return this.props.children
    return (
      <section role="alert" className="max-w-md mx-auto text-center py-12 flex flex-col gap-4">
        <h1 className="text-h2 font-semibold text-texto-principal">Algo salió mal en esta pantalla</h1>
        <p className="text-texto-secundario">
          No fue algo que hicieras tú. Recarga la página para intentarlo de nuevo; si sigue igual, escríbenos por
          WhatsApp y lo revisamos.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center rounded-boton font-medium min-h-boton px-boton-x bg-accion text-accion-texto hover:bg-accion-hover transition-[background-color,transform] duration-normal ease-estandar active:scale-97 focus-visible:outline-none focus-visible:shadow-foco"
          >
            Recargar la página
          </button>
          {/* <a> y no <Link>: si el error vino del router, un Link tampoco funcionaria */}
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-boton font-medium min-h-boton px-boton-x bg-accion-sec-fondo text-accion-sec-texto border border-accion-sec-borde hover:bg-superficie-elevada transition-[background-color,transform] duration-normal ease-estandar active:scale-97 focus-visible:outline-none focus-visible:shadow-foco"
          >
            Ir al inicio
          </a>
        </div>
      </section>
    )
  }
}
