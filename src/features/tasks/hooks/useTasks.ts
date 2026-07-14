import { useState, useEffect, useCallback } from "react"
import { apiFetch } from "../../../lib/apiFetch"
import { useAuthStore } from "../../../store/authStore"
import { DEFAULT_PER_PAGE } from "../types"
import type { Task, TasksPagination, TasksResponse, TaskStatus } from "../types"

interface UseTasksArgs {
  status: TaskStatus | null
  search: string
  page: number
  perPage?: number
}

const EMPTY_PAGINATION: TasksPagination = { page: 1, per_page: DEFAULT_PER_PAGE, total: 0 }

export function useTasks({ status, search, page, perPage = DEFAULT_PER_PAGE }: UseTasksArgs) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const [tasks, setTasks]           = useState<Task[]>([])
  const [pagination, setPagination] = useState<TasksPagination>(EMPTY_PAGINATION)
  const [isLoading, setIsLoading]   = useState(false)
  const [error, setError]           = useState<string | null>(null)

  const fetchTasks = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("per_page", String(perPage))
      if (status) params.set("status", status)
      if (search.trim()) params.set("search", search.trim())

      const res = await apiFetch(`/api/v1/app/tasks/?${params}`, { signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data: TasksResponse = await res.json()
      setTasks(data.tasks ?? [])
      setPagination(data.pagination ?? { ...EMPTY_PAGINATION, per_page: perPage })
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") return
      setError(err instanceof Error ? err.message : "Error al cargar tareas")
    } finally {
      setIsLoading(false)
    }
  }, [status, search, page, perPage])

  useEffect(() => {
    if (!isAuthenticated) {
      setTasks([])
      setPagination(EMPTY_PAGINATION)
      setError(null)
      return
    }
    const controller = new AbortController()
    fetchTasks(controller.signal)
    return () => controller.abort()
  }, [fetchTasks, isAuthenticated])

  const refetch = useCallback(() => fetchTasks(), [fetchTasks])

  return { tasks, pagination, isLoading, error, refetch }
}
