import { useState, useCallback } from 'react'
import { apiFetch } from '../../../lib/apiFetch'
import type { ConnectionAction } from '../types'

export function useRespondConnection(onSuccess?: () => void) {
  const [loading, setLoading] = useState(false)

  const respond = useCallback(async (id: string, action: ConnectionAction) => {
    setLoading(true)
    try {
      const res = await apiFetch(`/api/v1/app/chat/connections/${id}/respond/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (res.ok) onSuccess?.()
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [onSuccess])

  return { respond, loading }
}
