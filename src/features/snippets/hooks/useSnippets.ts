import { useState, useEffect, useCallback } from "react"
import { apiFetch } from "../../../lib/apiFetch"
import { useAuthStore } from "../../../store/authStore"
import { DEFAULT_PER_PAGE } from "../types"
import type { Snippet, SnippetsPagination, SnippetsResponse } from "../types"

interface UseSnippetsArgs {
  language: string | null
  tag: string | null
  search: string
  page: number
  perPage?: number
}

const EMPTY_PAGINATION: SnippetsPagination = { page: 1, per_page: DEFAULT_PER_PAGE, total: 0 }

export function useSnippets({ language, tag, search, page, perPage = DEFAULT_PER_PAGE }: UseSnippetsArgs) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const [snippets, setSnippets]     = useState<Snippet[]>([])
  const [pagination, setPagination] = useState<SnippetsPagination>(EMPTY_PAGINATION)
  const [isLoading, setIsLoading]   = useState(false)
  const [error, setError]           = useState<string | null>(null)

  const fetchSnippets = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      // page/per_page van siempre: sin 'page' el backend responde el shape
      // legacy {snippets: [...]} SIN clave 'pagination'.
      params.set("page", String(page))
      params.set("per_page", String(perPage))
      if (language) params.set("language", language)
      if (tag) params.set("tag", tag)
      if (search.trim()) params.set("search", search.trim())

      const res = await apiFetch(`/api/v1/app/snippets/?${params}`, { signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data: SnippetsResponse = await res.json()
      setSnippets(data.snippets ?? [])
      setPagination(data.pagination ?? { ...EMPTY_PAGINATION, per_page: perPage })
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") return
      setError(err instanceof Error ? err.message : "Error al cargar snippets")
    } finally {
      setIsLoading(false)
    }
  }, [language, tag, search, page, perPage])

  useEffect(() => {
    if (!isAuthenticated) {
      setSnippets([])
      setPagination(EMPTY_PAGINATION)
      setError(null)
      return
    }
    const controller = new AbortController()
    fetchSnippets(controller.signal)
    return () => controller.abort()
  }, [fetchSnippets, isAuthenticated])

  const refetch = useCallback(() => fetchSnippets(), [fetchSnippets])

  return { snippets, pagination, isLoading, error, refetch }
}
