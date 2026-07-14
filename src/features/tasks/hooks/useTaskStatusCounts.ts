import { useState, useEffect, useCallback } from "react"
import { apiFetch } from "../../../lib/apiFetch"
import { useAuthStore } from "../../../store/authStore"
import { STATUSES } from "../types"
import type { TaskStatus, TasksResponse } from "../types"

export function useTaskStatusCounts(search: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [counts, setCounts]   = useState<Partial<Record<TaskStatus, number>>>({})
  const [loading, setLoading] = useState(false)

  const fetchCounts = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    try {
      const results = await Promise.all(
        STATUSES.map(async (s) => {
          const params = new URLSearchParams({ status: s.value, page: "1", per_page: "1" })
          if (search.trim()) params.set("search", search.trim())
          const res = await apiFetch(`/api/v1/app/tasks/?${params}`, { signal })
          if (!res.ok) return [s.value, 0] as const
          const data: TasksResponse = await res.json()
          return [s.value, data.pagination?.total ?? 0] as const
        })
      )
      setCounts(Object.fromEntries(results))
    } catch (err) {
      if ((err as { name?: string })?.name !== "AbortError") setCounts({})
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    if (!isAuthenticated) {
      setCounts({})
      return
    }
    const controller = new AbortController()
    fetchCounts(controller.signal)
    return () => controller.abort()
  }, [fetchCounts, isAuthenticated])

  const refetch = useCallback(() => fetchCounts(), [fetchCounts])

  return { counts, loading, refetch }
}
