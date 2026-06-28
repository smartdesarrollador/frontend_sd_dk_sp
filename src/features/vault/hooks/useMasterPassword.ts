import { useState, useCallback } from 'react'
import { apiFetch } from '../../../lib/apiFetch'
import type { SetupResponse } from '../types'

export function useMasterPassword() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setup = useCallback(async (masterPassword: string): Promise<SetupResponse | null> => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch('/api/v1/app/vault/master-password/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ master_password: masterPassword }),
      })
      if (!res.ok) { setError('No se pudo configurar la contraseña maestra.'); return null }
      return (await res.json()) as SetupResponse
    } catch {
      setError('Error de conexión.')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const change = useCallback(async (currentPassword: string, newPassword: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch('/api/v1/app/vault/master-password/', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      })
      if (!res.ok) { setError('Contraseña actual incorrecta.'); return false }
      return true
    } catch {
      setError('Error de conexión.')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const recover = useCallback(async (recoveryCode: string, newPassword: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch('/api/v1/app/vault/recover/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recovery_code: recoveryCode, new_password: newPassword }),
      })
      if (!res.ok) { setError('Código de recuperación inválido.'); return false }
      return true
    } catch {
      setError('Error de conexión.')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return { setup, change, recover, loading, error, clearError: () => setError(null) }
}
