import { useCallback } from "react"
import { apiFetch } from "../../../lib/apiFetch"
import type { Task, TaskPriority, TaskStatus } from "../types"

export interface TaskPayload {
  title: string
  status: TaskStatus
  priority: TaskPriority
  description: string
  due_date: string | null
}

async function parseError(res: Response): Promise<string> {
  const body = await res.json().catch(() => null)
  return body?.detail ?? body?.title?.[0] ?? `HTTP ${res.status}`
}

export function useTaskMutations(onMutated: () => void) {
  const create = useCallback(async (payload: TaskPayload): Promise<Task> => {
    const res = await apiFetch("/api/v1/app/tasks/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(await parseError(res))
    const saved: Task = await res.json()
    onMutated()
    return saved
  }, [onMutated])

  const update = useCallback(async (id: string, payload: TaskPayload): Promise<Task> => {
    const res = await apiFetch(`/api/v1/app/tasks/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(await parseError(res))
    const saved: Task = await res.json()
    onMutated()
    return saved
  }, [onMutated])

  const remove = useCallback(async (id: string): Promise<boolean> => {
    const res = await apiFetch(`/api/v1/app/tasks/${id}/`, { method: "DELETE" })
    if (!res.ok) return false
    onMutated()
    return true
  }, [onMutated])

  return { create, update, remove }
}
