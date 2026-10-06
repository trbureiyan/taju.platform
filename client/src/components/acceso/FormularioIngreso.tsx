import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useSnackbar } from '../ui/Snackbar'
import { BotonVerContrasena } from './BotonVerContrasena'
import { errorDeAcceso, validarContrasenaIngreso, validarCorreo } from '../../lib/validarAcceso'
import type { Usuario } from '../../types'

/**
 * Formulario de ingreso. Lo usan la vista /login y el diálogo de sesión vencida del formulario de pedido.
 * @prop alIngresar - Se llama con el usuario ya autenticado; quien lo usa decide el destino.
 * @prop alCambiarCorreo - Opcional: avisa el correo escrito para reflejarlo en la constancia.
 */
interface FormularioIngresoProps {
  alIngresar: (usuario: Usuario) => void
  alCambiarCorreo?: (correo: string) => void
}

export function FormularioIngreso({ alIngresar, alCambiarCorreo }: FormularioIngresoProps) {
  const { login } = useAuth()
  const { avisar } = useSnackbar()
  const formulario = useRef<HTMLFormElement>(null)
  const enviandoRef = useRef(false)
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [tocados, setTocados] = useState({ correo: false, contrasena: false })
  const [verContrasena, setVerContrasena] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  const [fallos, setFallos] = useState(0)

  const errorCorreo = tocados.correo ? validarCorreo(correo) : null
  const errorContrasena = tocados.contrasena ? validarContrasenaIngreso(contrasena) : null

  // el foco va al primer campo inválido tras un intento fallido; un aviso nuevo por intento se anuncia de nuevo (key)
  useEffect(() => {
    if (fallos === 0) return
    formulario.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  }, [fallos])

  async function alEnviar(e: FormEvent) {
    e.preventDefault()
    if (enviandoRef.current) return
    setTocados({ correo: true, contrasena: true })
    setAviso(null)
    if (validarCorreo(correo) || validarContrasenaIngreso(contrasena)) {
      setAviso('Revisa los campos marcados. Sin ellos no podemos ingresarte a tu cuenta.')
      setFallos((n) => n + 1)
      return
    }
    enviandoRef.current = true
    setEnviando(true)
    try {
      const usuario = await login(correo.trim(), contrasena)
      alIngresar(usuario)
    } catch (err) {
      const e2 = errorDeAcceso(err, 'ingreso')
      if (e2.destino === 'snackbar') avisar(e2.mensaje, { tono: 'error' })
      else setAviso(e2.mensaje)
      setFallos((n) => n + 1)
    } finally {
      enviandoRef.current = false
      setEnviando(false)
    }
  }

  return (
    <form ref={formulario} onSubmit={alEnviar} noValidate className="flex flex-col gap-4">
      <Input
        label="Correo"
        type="email"
        autoComplete="email"
        value={correo}
        onChange={(e) => {
          setCorreo(e.target.value)
          alCambiarCorreo?.(e.target.value)
        }}
        onBlur={() => setTocados((t) => ({ ...t, correo: true }))}
        error={errorCorreo ?? undefined}
        anunciarError={false}
        required
      />
      <Input
        label="Contraseña"
        type={verContrasena ? 'text' : 'password'}
        autoComplete="current-password"
        value={contrasena}
        onChange={(e) => setContrasena(e.target.value)}
        onBlur={() => setTocados((t) => ({ ...t, contrasena: true }))}
        error={errorContrasena ?? undefined}
        anunciarError={false}
        required
        accion={<BotonVerContrasena visible={verContrasena} alAlternar={() => setVerContrasena((v) => !v)} />}
      />
      {aviso && (
        <p key={fallos} role="alert" className="text-sm text-error-texto">
          {aviso}
        </p>
      )}
      <Button type="submit" cargando={enviando} className="w-full">
        Ingresar
      </Button>
    </form>
  )
}
