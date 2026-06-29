import { useState, useEffect } from 'react'
import { apiFetch } from '../../../lib/apiFetch'
import type { ChatSearchResponse } from '../types'

export const CHAT_SEARCH_MIN_LEN = 2

export function useChatSearch(query: string) {
  const [data, setData]           = useState<ChatSearchResponse | null>(null)
  const [isFetching, setFetching] = useState(false)

  useEffect(() => {
    const q = query.trim()
    if (q.length < CHAT_SEARCH_MIN_LEN) {
      setData(null)
      return
    }

    const controller = new AbortController()
    setFetching(true)

    apiFetch(`/api/v1/app/chat/search/?q=${encodeURIComponent(q)}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((d: ChatSearchResponse) => {
        setData(d)
        setFetching(false)
      })
      .catch((err: unknown) => {
        if ((err as { name?: string })?.name !== 'AbortError') setFetching(false)
      })

    return () => controller.abort()
  }, [query])

  return { data, isFetching }
}
