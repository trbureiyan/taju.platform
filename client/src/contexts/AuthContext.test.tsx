import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { AuthProvider, useAuth } from './AuthContext'
import { api } from '../lib/api'

vi.mock('../lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../lib/api')>()),
  api: { post: vi.fn() },
}))

const envoltura = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>

beforeEach(() => vi.mocked(api.post).mockReset())

describe('AuthProvider | registrar', () => {
  it('envía aceptaDatos: true junto con los datos de la cuenta', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      token: 't',
      usuario: { _id: 'u1', nombre: 'Ana', email: 'ana@taju.co', rol: 'cliente' },
    })
    const { result } = renderHook(() => useAuth(), { wrapper: envoltura })
    await act(() => result.current.registrar('Ana', 'ana@taju.co', 'clave-segura-123', true))
    expect(api.post).toHaveBeenCalledWith('/auth/registrar', {
      nombre: 'Ana',
      email: 'ana@taju.co',
      password: 'clave-segura-123',
      aceptaDatos: true,
    })
  })
})
