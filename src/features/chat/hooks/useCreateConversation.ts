import { useState, useCallback } from 'react'
import { apiFetch } from '../../../lib/apiFetch'
import type { ConversationDetail, CreateConversationRequest } from '../types'

export function useCreateConversation(onSuccess?: (conv: ConversationDetail) => void) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const create = useCallback(async (payload: CreateConversationRequest) => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch('/api/v1/app/chat/conversations/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) { setError('Error creando conversación'); return }
      const conv = await res.json() as ConversationDetail
      onSuccess?.(conv)
    } catch {
      setError('Error de red')
    } finally {
      setLoading(false)
    }
  }, [onSuccess])

  return { create, loading, error }
}
