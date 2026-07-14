import { useState, useEffect, useCallback } from "react"
import { apiFetch } from "../../../lib/apiFetch"
import { useAuthStore } from "../../../store/authStore"
import { DEFAULT_PER_PAGE } from "../types"
import type { Contact, ContactsPagination, ContactsResponse } from "../types"

interface UseContactsArgs {
  group: string | null
  search: string
  page: number
  perPage?: number
}

const EMPTY_PAGINATION: ContactsPagination = { page: 1, per_page: DEFAULT_PER_PAGE, total: 0 }

export function useContacts({ group, search, page, perPage = DEFAULT_PER_PAGE }: UseContactsArgs) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const [contacts, setContacts]     = useState<Contact[]>([])
  const [pagination, setPagination] = useState<ContactsPagination>(EMPTY_PAGINATION)
  const [isLoading, setIsLoading]   = useState(false)
  const [error, setError]           = useState<string | null>(null)

  const fetchContacts = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      // page/per_page van siempre: sin 'page' el backend responde el shape
      // legacy {results,count,contacts} SIN clave 'pagination'.
      params.set("page", String(page))
      params.set("per_page", String(perPage))
      if (group) params.set("group", group)
      if (search.trim()) params.set("search", search.trim())

      const res = await apiFetch(`/api/v1/app/contacts/?${params}`, { signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data: ContactsResponse = await res.json()
      setContacts(data.contacts ?? [])
      setPagination(data.pagination ?? { ...EMPTY_PAGINATION, per_page: perPage })
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") return
      setError(err instanceof Error ? err.message : "Error al cargar contactos")
    } finally {
      setIsLoading(false)
    }
  }, [group, search, page, perPage])

  useEffect(() => {
    if (!isAuthenticated) {
      setContacts([])
      setPagination(EMPTY_PAGINATION)
      setError(null)
      return
    }
    const controller = new AbortController()
    fetchContacts(controller.signal)
    return () => controller.abort()
  }, [fetchContacts, isAuthenticated])

  const refetch = useCallback(() => fetchContacts(), [fetchContacts])

  return { contacts, pagination, isLoading, error, refetch }
}
