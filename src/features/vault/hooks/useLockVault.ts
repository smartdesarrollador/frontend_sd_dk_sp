import { useState, useCallback } from 'react'
import { apiFetch } from '../../../lib/apiFetch'
import { useVaultStore } from '../../../store/vaultStore'

export function useLockVault(onSettled?: () => void) {
  const [loading, setLoading] = useState(false)
  const lock = useVaultStore((s) => s.lock)

  const lockVault = useCallback(async () => {
    setLoading(true)
    try {
      await apiFetch('/api/v1/app/vault/lock/', { method: 'POST' })
    } catch {
      /* ignore */
    } finally {
      // Lock locally regardless of network result
      lock()
      setLoading(false)
      onSettled?.()
    }
  }, [lock, onSettled])

  return { lockVault, loading }
}
