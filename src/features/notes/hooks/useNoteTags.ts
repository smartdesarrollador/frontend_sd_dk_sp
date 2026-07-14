import { useState, useEffect, useCallback } from "react"
import { apiFetch } from "../../../lib/apiFetch"
import { useAuthStore } from "../../../store/authStore"

export function useNoteTags() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [tags, setTags]           = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchTags = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true)
    try {
      const res = await apiFetch("/api/v1/app/notes/tags/", { signal })
      if (!res.ok) return
      const data: { tags: string[] } = await res.json()
      setTags(data.tags ?? [])
    } catch (err) {
      if ((err as { name?: string })?.name !== "AbortError") setTags([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      setTags([])
      return
    }
    const controller = new AbortController()
    fetchTags(controller.signal)
    return () => controller.abort()
  }, [fetchTags, isAuthenticated])

  const refetch = useCallback(() => fetchTags(), [fetchTags])

  return { tags, isLoading, refetch }
}
