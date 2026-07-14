import { useState, useEffect, useCallback } from "react"
import { apiFetch } from "../../../lib/apiFetch"
import { useAuthStore } from "../../../store/authStore"
import { DEFAULT_PER_PAGE } from "../types"
import type { Note, NotesPagination, NotesResponse } from "../types"

interface UseNotesArgs {
  category: string | null
  tag: string | null
  search: string
  page: number
  perPage?: number
}

const EMPTY_PAGINATION: NotesPagination = { page: 1, per_page: DEFAULT_PER_PAGE, total: 0 }

export function useNotes({ category, tag, search, page, perPage = DEFAULT_PER_PAGE }: UseNotesArgs) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const [notes, setNotes]           = useState<Note[]>([])
  const [pagination, setPagination] = useState<NotesPagination>(EMPTY_PAGINATION)
  const [isLoading, setIsLoading]   = useState(false)
  const [error, setError]           = useState<string | null>(null)

  const fetchNotes = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      // page/per_page van siempre: sin 'page' el backend responde el shape
      // legacy {results,count,notes} SIN clave 'pagination'.
      params.set("page", String(page))
      params.set("per_page", String(perPage))
      if (category) params.set("category", category)
      if (tag) params.set("tag", tag)
      if (search.trim()) params.set("search", search.trim())

      const res = await apiFetch(`/api/v1/app/notes/?${params}`, { signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data: NotesResponse = await res.json()
      setNotes(data.notes ?? [])
      setPagination(data.pagination ?? { ...EMPTY_PAGINATION, per_page: perPage })
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") return
      setError(err instanceof Error ? err.message : "Error al cargar notas")
    } finally {
      setIsLoading(false)
    }
  }, [category, tag, search, page, perPage])

  useEffect(() => {
    if (!isAuthenticated) {
      setNotes([])
      setPagination(EMPTY_PAGINATION)
      setError(null)
      return
    }
    const controller = new AbortController()
    fetchNotes(controller.signal)
    return () => controller.abort()
  }, [fetchNotes, isAuthenticated])

  const refetch = useCallback(() => fetchNotes(), [fetchNotes])

  return { notes, pagination, isLoading, error, refetch }
}
