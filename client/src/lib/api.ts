// VITE_API_URL para prod/preview, localhost:3001 como default de desarrollo
export const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'

// ─── Token en memoria ──────────────────────────────────────────────────────
// vive solo en memoria del modulo, nada de localStorage ni cookies - si el usuario recarga, se cae la sesion (a proposito)
let _token: string | null = null

/**
 * Actualiza el token JWT en memoria del módulo.
 * Pasar null cierra la sesión sin tocar el servidor — el token stateless simplemente se olvida.
 * @param token - Cadena JWT o null para cerrar sesión.
 */
export function setToken(token: string | null): void {
  _token = token
}

/**
 * Devuelve el token JWT activo, o null si no hay sesión.
 * Solo disponible en memoria; se pierde al recargar la página.
 */
export function getToken(): string | null {
  return _token
}

// ─── Cliente HTTP ─────────────────────────────────────────────────────────────

/**
 * Error de una respuesta no-2xx del servidor. Una caída de red no llega aquí: fetch rechaza con TypeError.
 * @prop estado - Código HTTP, para distinguir por ejemplo un 404 (no existe) de un 500 (falló el servidor).
 */
export class ErrorApi extends Error {
  constructor(
    message: string,
    public readonly estado: number
  ) {
    super(message)
    this.name = 'ErrorApi'
  }
}

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
    throw new ErrorApi(body.error ?? `Error ${res.status}`, res.status)
  }

  // 204 (DELETE) no trae body - .json() explota con SyntaxError sobre un string vacio
  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}

/**
 * Cliente HTTP tipado. Cada método serializa el cuerpo, añade el token Bearer si hay sesión activa,
 * y lanza un ErrorApi con el mensaje y el código del servidor si la respuesta no es 2xx.
 * @throws ErrorApi con body.error del servidor (o "Error {status}") y el código HTTP; TypeError si falla la red.
 */
export const api = {
  /** GET al path dado. Infiere T del tipo de retorno esperado. */
  get: <T>(path: string) => request<T>(path),
  /** POST con cuerpo JSON serializado. */
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  /** PATCH con cuerpo JSON serializado. */
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  /** POST con FormData (para subir archivos); el Content-Type lo pone el navegador con su boundary). */
  postForm: <T>(path: string, body: FormData) => request<T>(path, { method: 'POST', body }),
  /** DELETE; retorna void por defecto (204 No Content). */
  delete: <T = void>(path: string) => request<T>(path, { method: 'DELETE' }),
}
