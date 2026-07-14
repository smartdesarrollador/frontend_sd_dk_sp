import { useState, useEffect, useCallback } from "react"
import { apiFetch } from "../../../lib/apiFetch"
import { useAuthStore } from "../../../store/authStore"
import type { NoteCategory } from "../types"

export function useNoteCategories() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [categories, setCategories] = useState<NoteCategory[]>([])
  const [isLoading, setIsLoading]   = useState(false)

  const fetchCategories = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true)
    try {
      const res = await apiFetch("/api/v1/app/notes/categories/", { signal })
      if (!res.ok) return
      const data = await res.json()
      setCategories(data.categories ?? [])
    } catch (err) {
      if ((err as { name?: string })?.name !== "AbortError") setCategories([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      setCategories([])
      return
    }
    const controller = new AbortController()
    fetchCategories(controller.signal)
    return () => controller.abort()
  }, [fetchCategories, isAuthenticated])

  const refetch = useCallback(() => fetchCategories(), [fetchCategories])

  return { categories, isLoading, refetch }
}
