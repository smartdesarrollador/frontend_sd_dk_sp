import { useCallback } from "react"
import { apiFetch } from "../../../lib/apiFetch"
import type { Snippet } from "../types"

export interface SnippetPayload {
  title: string
  code: string
  language: string
  description: string
  tags: string[]
}

async function parseError(res: Response): Promise<string> {
  const body = await res.json().catch(() => null)
  return body?.detail ?? body?.title?.[0] ?? body?.code?.[0] ?? `HTTP ${res.status}`
}

export function useSnippetMutations(onMutated: () => void) {
  const create = useCallback(async (payload: SnippetPayload): Promise<Snippet> => {
    const res = await apiFetch("/api/v1/app/snippets/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(await parseError(res))
    const saved: Snippet = await res.json()
    onMutated()
    return saved
  }, [onMutated])

  const update = useCallback(async (id: string, payload: SnippetPayload): Promise<Snippet> => {
    const res = await apiFetch(`/api/v1/app/snippets/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(await parseError(res))
    const saved: Snippet = await res.json()
    onMutated()
    return saved
  }, [onMutated])

  const remove = useCallback(async (id: string): Promise<boolean> => {
    const res = await apiFetch(`/api/v1/app/snippets/${id}/`, { method: "DELETE" })
    if (!res.ok) return false
    onMutated()
    return true
  }, [onMutated])

  return { create, update, remove }
}
