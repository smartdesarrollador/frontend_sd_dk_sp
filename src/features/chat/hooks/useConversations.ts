import { useState, useCallback, useEffect, useRef } from 'react'
import { apiFetch } from '../../../lib/apiFetch'
import type { Conversation } from '../types'

interface ConversationsResponse {
  results: Conversation[]
  count: number
}

export function useConversations(wsConnected = false) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetch = useCallback(async () => {
    try {
      const res = await apiFetch('/api/v1/app/chat/conversations/')
      if (!res.ok) { setError('Error cargando conversaciones'); return }
      const data = await res.json() as ConversationsResponse
      setConversations(data.results)
      setError(null)
    } catch {
      setError('Error de red')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch()
    // Slow polling when WebSocket is alive, fast fallback otherwise
    const interval = wsConnected ? 30_000 : 5_000
    intervalRef.current = setInterval(fetch, interval)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [fetch, wsConnected])

  return { conversations, loading, error, refetch: fetch }
}
