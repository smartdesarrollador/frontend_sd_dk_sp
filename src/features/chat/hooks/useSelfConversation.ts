import { useState, useCallback } from 'react'
import { apiFetch } from '../../../lib/apiFetch'
import type { ConversationDetail } from '../types'

export function useSelfConversation(onSuccess?: (conv: ConversationDetail) => void) {
  const [loading, setLoading] = useState(false)

  const openSelf = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch('/api/v1/app/chat/conversations/self/', { method: 'POST' })
      if (!res.ok) return
      const conv = await res.json() as ConversationDetail
      onSuccess?.(conv)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [onSuccess])

  return { openSelf, loading }
}
