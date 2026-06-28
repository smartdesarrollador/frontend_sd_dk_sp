import { useState, useCallback, useEffect } from 'react'
import { apiFetch } from '../../../lib/apiFetch'
import type { VaultStatus } from '../types'

export function useVaultStatus() {
  const [status, setStatus] = useState<VaultStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    try {
      const res = await apiFetch('/api/v1/app/vault/master-password/')
      if (!res.ok) return
      setStatus(await res.json() as VaultStatus)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refetch() }, [refetch])

  return { status, loading, refetch }
}
