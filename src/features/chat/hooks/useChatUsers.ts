import { useState, useCallback, useEffect } from 'react'
import { apiFetch } from '../../../lib/apiFetch'
import type { ChatUser } from '../types'

interface ChatUsersResponse {
  users: ChatUser[]
}

export function useChatUsers(enabled = true) {
  const [users, setUsers] = useState<ChatUser[]>([])
  const [loading, setLoading] = useState(false)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch('/api/v1/app/chat/users/')
      if (!res.ok) return
      const data = await res.json() as ChatUsersResponse
      setUsers(data.users)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    fetch()
  }, [enabled, fetch])

  return { users, loading, refetch: fetch }
}
