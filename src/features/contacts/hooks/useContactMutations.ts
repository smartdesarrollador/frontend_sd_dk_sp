import { useCallback } from "react"
import { apiFetch } from "../../../lib/apiFetch"
import type { Contact } from "../types"

export interface ContactPayload {
  name: string
  email: string
  phone: string
  company: string
  job_title: string
  group: string | null
  notes: string
}

async function parseError(res: Response): Promise<string> {
  const body = await res.json().catch(() => null)
  return body?.detail ?? body?.name?.[0] ?? body?.email?.[0] ?? `HTTP ${res.status}`
}

export function useContactMutations(onMutated: () => void) {
  const create = useCallback(async (payload: ContactPayload): Promise<Contact> => {
    const res = await apiFetch("/api/v1/app/contacts/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(await parseError(res))
    const saved: Contact = await res.json()
    onMutated()
    return saved
  }, [onMutated])

  const update = useCallback(async (id: string, payload: ContactPayload): Promise<Contact> => {
    const res = await apiFetch(`/api/v1/app/contacts/${id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(await parseError(res))
    const saved: Contact = await res.json()
    onMutated()
    return saved
  }, [onMutated])

  const remove = useCallback(async (id: string): Promise<boolean> => {
    const res = await apiFetch(`/api/v1/app/contacts/${id}/`, { method: "DELETE" })
    if (!res.ok) return false
    onMutated()
    return true
  }, [onMutated])

  return { create, update, remove }
}
