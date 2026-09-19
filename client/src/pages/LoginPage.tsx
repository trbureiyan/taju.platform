import { useState, type FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'

export function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setCargando(true)
    try {
      await login(email, password)
      // [!] window.location.href hace un reload completo de la SPA - como el token vive solo en memoria
      // (ver lib/api.ts), esto probablemente borra la sesion recien creada antes de que el catalogo la vea.
      // un navigate('/catalogo') de react-router evitaria el reload y no perderia el token.
      window.location.href = '/catalogo'
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
        <a href="/registrar" className="text-accion hover:underline">
          Registrate
        </a>
      </p>
    </div>
  )
}
