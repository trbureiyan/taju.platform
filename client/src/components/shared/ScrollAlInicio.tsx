import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

// BrowserRouter no maneja el scroll: sin esto el detalle se abre a la altura donde estaba la tarjeta.
// Solo al avanzar (PUSH/REPLACE de ruta): al volver atras (POP) el navegador restaura la posicion en la lista.
export function ScrollAlInicio() {
  const { pathname } = useLocation()
  const tipo = useNavigationType()

  useEffect(() => {
    if (tipo !== 'POP') window.scrollTo(0, 0)
  }, [pathname, tipo])

  return null
}
