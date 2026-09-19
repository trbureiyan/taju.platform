import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { RUTA_INICIO_POR_ROL } from '../types'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setCargando(true)
    try {
      const usuario = await login(email, password)
      // navigate en vez de window.location.href: un reload completo perderia el token, que solo vive en
      // memoria (ver lib/api.ts). ?redirect= vuelve a la ruta que motivo el login (ej. desde un pedido)
      const destino = searchParams.get('redirect') || RUTA_INICIO_POR_ROL[usuario.rol]
      navigate(destino, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos iniciar sesión')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-16">
      <h1 className="text-2xl font-semibold text-texto-principal mb-8">Ingresá a tu cuenta</h1>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <Input
          label="Correo"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {/* el server ya manda "Credenciales incorrectas" - aca se le agrega el siguiente paso concreto */}
        {error && (
          <p role="alert" className="text-sm text-error-texto">
            {error}. Revisá tu correo y contraseña e intentá de nuevo.
          </p>
        )}

        <Button type="submit" cargando={cargando} className="w-full">
          Ingresar
        </Button>
      </form>

      <p className="mt-6 text-sm text-texto-secundario text-center">
        ¿No tenés cuenta?{' '}
        <Link to="/registrar" className="text-accion hover:underline">
          Registrate
        </Link>
      </p>
    </div>
  )
}
