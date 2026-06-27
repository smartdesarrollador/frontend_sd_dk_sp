import { useState, useCallback, useEffect } from 'react'
import { apiFetch } from '../../../lib/apiFetch'
import type { ConnectionsResponse } from '../types'

const EMPTY: ConnectionsResponse = { accepted: [], pending_incoming: [], pending_outgoing: [] }

export function useConnections(enabled = true) {
  const [connections, setConnections] = useState<ConnectionsResponse>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch('/api/v1/app/chat/connections/')
      if (!res.ok) { setError('Error cargando conexiones'); return }
      const data = await res.json() as ConnectionsResponse
      setConnections(data)
      setError(null)
    } catch {
      setError('Error de red')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    fetch()
    const interval = setInterval(fetch, 15_000)
    return () => clearInterval(interval)
  }, [enabled, fetch])

  return { connections, loading, error, refetch: fetch }
}
