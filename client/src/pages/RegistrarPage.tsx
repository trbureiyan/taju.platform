import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { RUTA_INICIO_POR_ROL } from '../types'

export function RegistrarPage() {
  const { registrar } = useAuth()
  const navigate = useNavigate()
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setCargando(true)
    try {
      const usuario = await registrar(nombre, email, password)
      // navigate en vez de window.location.href: un reload completo perderia el token recien guardado en memoria
      navigate(RUTA_INICIO_POR_ROL[usuario.rol], { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos crear tu cuenta')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-16">
      <h1 className="text-2xl font-semibold text-texto-principal mb-8">Creá tu cuenta</h1>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <Input
          label="Nombre"
          type="text"
          autoComplete="name"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
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
          autoComplete="new-password"
          hint="Mínimo 8 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />

        {error && (
          <p role="alert" className="text-sm text-error-texto">
            {error}. Si el correo ya está registrado, ingresá directamente.
          </p>
        )}

        <Button type="submit" cargando={cargando} className="w-full">
          Crear cuenta
        </Button>
      </form>

      <p className="mt-6 text-sm text-texto-secundario text-center">
        ¿Ya tenés cuenta?{' '}
        <Link to="/login" className="font-medium text-texto-principal hover:underline">
          Ingresá
        </Link>
      </p>
    </div>
  )
}
