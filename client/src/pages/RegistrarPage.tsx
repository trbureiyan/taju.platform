import { useState, type FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'

export function RegistrarPage() {
  const { registrar } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setCargando(true)
    try {
      await registrar(email, password)
      // [!] mismo problema que en LoginPage.tsx: reload completo puede tirar el token recien puesto en memoria
      window.location.href = '/catalogo'
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
        <a href="/login" className="text-accion hover:underline">
          Ingresá
        </a>
      </p>
    </div>
  )
}
