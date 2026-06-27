import { useCallback } from 'react'
import { apiFetch } from '../../../lib/apiFetch'

export function useMarkRead(onSuccess?: () => void) {
  const markRead = useCallback(async (conversationId: string) => {
    try {
      const res = await apiFetch(`/api/v1/app/chat/conversations/${conversationId}/read/`, {
        method: 'POST',
      })
      if (res.ok) onSuccess?.()
    } catch {
      /* ignore */
    }
  }, [onSuccess])

  return { markRead }
}
