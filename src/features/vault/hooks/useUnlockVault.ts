import { useState, useCallback } from 'react'
import { apiFetch } from '../../../lib/apiFetch'
import { useVaultStore } from '../../../store/vaultStore'
import type { UnlockResponse } from '../types'

export function useUnlockVault(onSuccess?: () => void) {
  const [loading, setLoading] = useState(false)
  const [errorStatus, setErrorStatus] = useState<number | null>(null)
  const unlock = useVaultStore((s) => s.unlock)

  const unlockVault = useCallback(async (masterPassword: string) => {
    setLoading(true)
    setErrorStatus(null)
    try {
      const res = await apiFetch('/api/v1/app/vault/unlock/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ master_password: masterPassword }),
      })
      if (!res.ok) { setErrorStatus(res.status); return }
      const data = await res.json() as UnlockResponse
      unlock(data.unlock_token, data.expires_in)
      onSuccess?.()
    } catch {
      setErrorStatus(0)
    } finally {
      setLoading(false)
    }
  }, [unlock, onSuccess])

  const errorMessage =
    errorStatus === 429 ? 'Demasiados intentos. Espera unos minutos.' :
    errorStatus === 401 ? 'Contraseña maestra incorrecta.' :
    errorStatus !== null ? 'No se pudo desbloquear. Inténtalo de nuevo.' : null

  return { unlockVault, loading, errorMessage }
}
