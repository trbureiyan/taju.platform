import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { PantallaAcceso } from '../components/acceso/PantallaAcceso'
import { Constancia } from '../components/acceso/Constancia'
import { FormularioIngreso } from '../components/acceso/FormularioIngreso'
import { titularDeAcceso } from '../components/acceso/titulares'
import { conRetorno, motivoDeRetorno, rutaDeRetorno } from '../lib/retorno'
import { RUTA_INICIO_POR_ROL } from '../types'

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [correo, setCorreo] = useState('')
  // [DECISION] ?redirect= se valida (solo rutas internas): lo escribe quien arma la URL, no la app
  const retorno = rutaDeRetorno(searchParams.get('redirect'))
  const { titulo, apoyo } = titularDeAcceso('ingreso', motivoDeRetorno(retorno))

  return (
    <PantallaAcceso titulo={titulo} apoyo={apoyo} constancia={<Constancia modo="ingreso" correo={correo} />}>
      <div className="flex flex-col gap-6">
        <FormularioIngreso
          alCambiarCorreo={setCorreo}
          // navigate en vez de recargar: un reload completo perdería el token, que solo vive en memoria (lib/api.ts)
          alIngresar={(usuario) => navigate(retorno ?? RUTA_INICIO_POR_ROL[usuario.rol], { replace: true })}
        />
        <p className="text-center text-sm text-texto-secundario">
          ¿Aún no tienes cuenta?{' '}
          <Link to={conRetorno('/registrar', retorno)} className="font-medium text-texto-principal hover:underline">
            Crea una cuenta
          </Link>
        </p>
      </div>
    </PantallaAcceso>
  )
}
