import { useCallback } from "react"
import { apiFetch } from "../../../lib/apiFetch"
import type { BookmarkItem } from "../types"

export interface BookmarkPayload {
  url: string
  title: string
  description: string
  collection: string | null
  tags: string[]
  favicon_url: string
}

async function parseError(res: Response): Promise<string> {
  const body = await res.json().catch(() => null)
  return body?.detail ?? body?.url?.[0] ?? body?.title?.[0] ?? `HTTP ${res.status}`
}

export function useBookmarkMutations(onMutated: () => void) {
  const create = useCallback(async (payload: BookmarkPayload): Promise<BookmarkItem> => {
    const res = await apiFetch("/api/v1/app/bookmarks/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(await parseError(res))
    const saved: BookmarkItem = await res.json()
    onMutated()
    return saved
  }, [onMutated])

  const update = useCallback(async (id: string, payload: BookmarkPayload): Promise<BookmarkItem> => {
    const res = await apiFetch(`/api/v1/app/bookmarks/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(await parseError(res))
    const saved: BookmarkItem = await res.json()
    onMutated()
    return saved
  }, [onMutated])

  const remove = useCallback(async (id: string): Promise<boolean> => {
    const res = await apiFetch(`/api/v1/app/bookmarks/${id}/`, { method: "DELETE" })
    if (!res.ok) return false
    onMutated()
    return true
  }, [onMutated])

  return { create, update, remove }
}
