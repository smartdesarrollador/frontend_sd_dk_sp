import { useCallback } from "react"
import { apiFetch } from "../../../lib/apiFetch"
import type { Note } from "../types"

export interface NotePayload {
  title: string
  content: string
  category: string | null
  is_pinned: boolean
  tags: string[]
}

async function parseError(res: Response): Promise<string> {
  const body = await res.json().catch(() => null)
  return body?.detail ?? body?.title?.[0] ?? `HTTP ${res.status}`
}

export function useNoteMutations(onMutated: () => void) {
  const create = useCallback(async (payload: NotePayload): Promise<Note> => {
    const res = await apiFetch("/api/v1/app/notes/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(await parseError(res))
    const saved: Note = await res.json()
    onMutated()
    return saved
  }, [onMutated])

  const update = useCallback(async (id: string, payload: NotePayload): Promise<Note> => {
    const res = await apiFetch(`/api/v1/app/notes/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(await parseError(res))
    const saved: Note = await res.json()
    onMutated()
    return saved
  }, [onMutated])

  const remove = useCallback(async (id: string): Promise<boolean> => {
    const res = await apiFetch(`/api/v1/app/notes/${id}/`, { method: "DELETE" })
    if (!res.ok) return false
    onMutated()
    return true
  }, [onMutated])

  const togglePin = useCallback(async (id: string): Promise<Note | null> => {
    const res = await apiFetch(`/api/v1/app/notes/${id}/pin/`, { method: "PATCH" })
    if (!res.ok) return null
    const saved: Note = await res.json()
    onMutated()
    return saved
  }, [onMutated])

  return { create, update, remove, togglePin }
}
