import { useState, useCallback } from 'react'
import { apiFetch } from '../../../lib/apiFetch'

export function useLeaveConversation(onSuccess?: () => void) {
  const [loading, setLoading] = useState(false)

  const leave = useCallback(async (conversationId: string) => {
    setLoading(true)
    try {
      const res = await apiFetch(`/api/v1/app/chat/conversations/${conversationId}/`, {
        method: 'DELETE',
      })
      if (res.ok) onSuccess?.()
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [onSuccess])

  return { leave, loading }
}
