import { useState, useCallback, useEffect, useRef } from 'react'
import { apiFetch } from '../../../lib/apiFetch'
import type { Message } from '../types'

interface MessagesResponse {
  results: Message[]
  count: number
  has_more: boolean
}

export function useMessages(conversationId: string | null, wsConnected = false) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const convIdRef = useRef(conversationId)
  convIdRef.current = conversationId

  const fetch = useCallback(async () => {
    if (!convIdRef.current) return
    setLoading((prev) => (prev ? prev : true))
    try {
      const res = await apiFetch(`/api/v1/app/chat/messages/?conversation=${convIdRef.current}`)
      if (!res.ok) { setError('Error cargando mensajes'); return }
      const data = await res.json() as MessagesResponse
      setMessages(data.results)
      setError(null)
    } catch {
      setError('Error de red')
    } finally {
      setLoading(false)
    }
  }, [])

  const appendMessage = useCallback((msg: Message) => {
    if (msg.conversation !== convIdRef.current) return
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev
      return [...prev, msg]
    })
  }, [])

  useEffect(() => {
    if (!conversationId) {
      setMessages([])
      setLoading(false)
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    setLoading(true)
    fetch()
    const interval = wsConnected ? 20_000 : 3_000
    intervalRef.current = setInterval(fetch, interval)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [conversationId, fetch, wsConnected])

  return { messages, loading, error, refetch: fetch, appendMessage }
}
