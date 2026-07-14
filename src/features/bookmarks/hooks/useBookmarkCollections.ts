import { useState, useEffect, useCallback } from "react"
import { apiFetch } from "../../../lib/apiFetch"
import { useAuthStore } from "../../../store/authStore"
import type { BookmarkCollection } from "../types"

export function useBookmarkCollections() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [collections, setCollections] = useState<BookmarkCollection[]>([])
  const [isLoading, setIsLoading]     = useState(false)

  const fetchCollections = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true)
    try {
      const res = await apiFetch("/api/v1/app/bookmarks/collections/", { signal })
      if (!res.ok) return
      const data = await res.json()
      setCollections(data.collections ?? [])
    } catch (err) {
      if ((err as { name?: string })?.name !== "AbortError") setCollections([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      setCollections([])
      return
    }
    const controller = new AbortController()
    fetchCollections(controller.signal)
    return () => controller.abort()
  }, [fetchCollections, isAuthenticated])

  const refetch = useCallback(() => fetchCollections(), [fetchCollections])

  return { collections, isLoading, refetch }
}
