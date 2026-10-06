import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useMedia } from '../hooks/useMedia'
import { Button } from '../components/ui/Button'
import { Casilla } from '../components/ui/Casilla'
import { Input } from '../components/ui/Input'
import { useSnackbar } from '../components/ui/Snackbar'
import { BotonVerContrasena } from '../components/acceso/BotonVerContrasena'
import { Constancia } from '../components/acceso/Constancia'
import { PantallaAcceso } from '../components/acceso/PantallaAcceso'
import { titularDeAcceso } from '../components/acceso/titulares'
import { conRetorno, motivoDeRetorno, rutaDeRetorno } from '../lib/retorno'
import { CONTRASENA_MIN, errorDeAcceso, validarContrasena, validarCorreo, validarNombre } from '../lib/validarAcceso'
import { RUTA_INICIO_POR_ROL } from '../types'

// [DECISION] 650 ms de espera tras crear la cuenta para que se vea la constancia completa; 300 con movimiento reducido.
// Es teatro breve en el momento de más fricción, pero es parte de la idea. Quitarlo es cambiar estas dos constantes.
const ESPERA_MS = 650
const ESPERA_REDUCIDA_MS = 300

type Campo = 'nombre' | 'correo' | 'contrasena' | 'acepta'

export function RegistrarPage() {
  const { registrar } = useAuth()
  const { avisar } = useSnackbar()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const reducido = useMedia('(prefers-reduced-motion: reduce)')
  const retorno = rutaDeRetorno(searchParams.get('redirect'))
  const { titulo, apoyo } = titularDeAcceso('registro', motivoDeRetorno(retorno))

  const formulario = useRef<HTMLFormElement>(null)
  const enviandoRef = useRef(false)
  const montada = useRef(true)
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [acepta, setAcepta] = useState(false)
  const [tocados, setTocados] = useState<Record<Campo, boolean>>({ nombre: false, correo: false, contrasena: false, acepta: false })
  const [errorServidor, setErrorServidor] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [fallos, setFallos] = useState(0)
  const [verContrasena, setVerContrasena] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [confirmada, setConfirmada] = useState(false)

  useEffect(() => {
    montada.current = true
    return () => {
      montada.current = false
    }
  }, [])
  useEffect(() => {
    if (fallos === 0) return
    formulario.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  }, [fallos])

  const errores = {
    nombre: tocados.nombre ? validarNombre(nombre) : null,
    correo: (tocados.correo ? validarCorreo(correo) : null) ?? errorServidor,
    contrasena: tocados.contrasena ? validarContrasena(contrasena) : null,
    acepta: tocados.acepta && !acepta ? 'Marca la casilla para crear tu cuenta: sin tu autorización no podemos guardar tus datos.' : null,
  }

  async function alEnviar(e: FormEvent) {
    e.preventDefault()
    if (enviandoRef.current) return
    setTocados({ nombre: true, correo: true, contrasena: true, acepta: true })
    setAviso(null)
    if (validarNombre(nombre) || validarCorreo(correo) || validarContrasena(contrasena) || !acepta) {
      setAviso('Revisa los campos marcados. Sin esos datos no podemos crear tu cuenta ni dejarla a tu nombre.')
      setFallos((n) => n + 1)
      return
    }
    enviandoRef.current = true
    setEnviando(true)
    try {
      const usuario = await registrar(nombre.trim(), correo.trim(), contrasena, true)
      setConfirmada(true)
      await new Promise((r) => setTimeout(r, reducido ? ESPERA_REDUCIDA_MS : ESPERA_MS))
      // navigate en vez de recargar: un reload perdería el token recién guardado en memoria; sin navegar si ya salió
      if (montada.current) navigate(retorno ?? RUTA_INICIO_POR_ROL[usuario.rol], { replace: true })
    } catch (err) {
      const fallo = errorDeAcceso(err, 'registro')
      if (fallo.destino === 'correo') setErrorServidor(fallo.mensaje)
      else if (fallo.destino === 'aviso') setAviso(fallo.mensaje)
      else avisar(fallo.mensaje, { tono: 'error' })
      setFallos((n) => n + 1)
      enviandoRef.current = false
      setEnviando(false)
    }
  }

  const marcar = (campo: Campo) => () => setTocados((t) => ({ ...t, [campo]: true }))

  return (
    <PantallaAcceso
      titulo={titulo}
      apoyo={apoyo}
      constancia={
        <Constancia
          modo="registro"
          nombre={nombre}
          correo={correo}
          contrasenaDefinida={contrasena.length >= CONTRASENA_MIN}
          confirmada={confirmada}
        />
      }
    >
      <form ref={formulario} onSubmit={alEnviar} noValidate className="flex flex-col gap-4">
        <Input
          label="Nombre"
          autoComplete="name"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          onBlur={marcar('nombre')}
          error={errores.nombre ?? undefined}
          anunciarError={false}
          required
        />
        <Input
          label="Correo"
          type="email"
          autoComplete="email"
          value={correo}
          onChange={(e) => {
            setCorreo(e.target.value)
            setErrorServidor(null)
          }}
          onBlur={marcar('correo')}
          error={errores.correo ?? undefined}
          anunciarError={false}
          required
        />
        {errorServidor && (
          <p className="-mt-2 text-sm text-texto-secundario">
            <Link to={conRetorno('/login', retorno)} className="font-medium text-texto-principal hover:underline">
              Ingresa
            </Link>{' '}
            con ese correo para seguir tus pedidos.
          </p>
        )}
        <Input
          label="Contraseña"
          type={verContrasena ? 'text' : 'password'}
          autoComplete="new-password"
          hint={`Mínimo ${CONTRASENA_MIN} caracteres`}
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
          onBlur={marcar('contrasena')}
          error={errores.contrasena ?? undefined}
          anunciarError={false}
          required
          accion={<BotonVerContrasena visible={verContrasena} alAlternar={() => setVerContrasena((v) => !v)} />}
        />
        <Casilla
          checked={acepta}
          onChange={(e) => setAcepta(e.target.checked)}
          onBlur={marcar('acepta')}
          error={errores.acepta ?? undefined}
          anunciarError={false}
          etiqueta={
            <>
              Autorizo el tratamiento de mis datos para gestionar mi cuenta y mis pedidos.{' '}
              {/* pestaña nueva: el formulario vive en memoria y volver atrás borraría lo escrito */}
              <Link to="/datos" target="_blank" rel="noopener noreferrer" className="font-medium underline underline-offset-4">
                Cómo tratamos tus datos
              </Link>
            </>
          }
        />
        {aviso && (
          <p key={fallos} role="alert" className="text-sm text-error-texto">
            {aviso}
          </p>
        )}
        <Button type="submit" cargando={enviando} className="w-full">
          Crear cuenta
        </Button>
        <p className="text-center text-sm text-texto-secundario">
          ¿Ya tienes cuenta?{' '}
          <Link to={conRetorno('/login', retorno)} className="font-medium text-texto-principal hover:underline">
            Ingresa
          </Link>
        </p>
      </form>
    </PantallaAcceso>
  )
}
