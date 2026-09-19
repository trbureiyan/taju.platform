// VITE_API_URL para prod/preview, localhost:3001 como default de desarrollo
const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'

// ─── Token en memoria ──────────────────────────────────────────────────────
// vive solo en memoria del modulo, nada de localStorage ni cookies - si el usuario recarga, se cae la sesion (a proposito)
let _token: string | null = null

export function setToken(token: string | null): void {
  _token = token
}

export function getToken(): string | null {
  return _token
}

// ─── Cliente HTTP ─────────────────────────────────────────────────────────────

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  // fetch pone su propio boundary de multipart si dejamos que el navegador arme el Content-Type
  const isFormData = init.body instanceof FormData
  const headers: Record<string, string> = {
    ...(!isFormData && { 'Content-Type': 'application/json' }),
    ...(init.headers as Record<string, string>),
  }
  if (_token) headers['Authorization'] = `Bearer ${_token}`

  const res = await fetch(`${BASE}${path}`, { ...init, headers })

  if (!res.ok) {
    // el server siempre responde { error: string } en fallos (ver controllers) - .catch cubre el caso raro donde no
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Error ${res.status}`)
  }

  // 204 (DELETE) no trae body - .json() explota con SyntaxError sobre un string vacio
  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}

// wrapper delgado sobre request() - cada metodo solo fija el verbo http, la logica vive arriba
export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  postForm: <T>(path: string, body: FormData) =>
    request<T>(path, { method: 'POST', body }),
  delete: <T = void>(path: string) => request<T>(path, { method: 'DELETE' }),
}
