import { useState, useCallback } from 'react'
import { apiFetch } from '../../../lib/apiFetch'
import type { ConvertMessageRequest, ConvertMessageResponse } from '../types'

export function useConvertMessage() {
  const [loading, setLoading] = useState(false)

  const convert = useCallback(async (messageId: string, payload: ConvertMessageRequest) => {
    setLoading(true)
    try {
      const res = await apiFetch(`/api/v1/app/chat/messages/${messageId}/convert/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) return null
      return await res.json() as ConvertMessageResponse
    } catch {
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { convert, loading }
}
