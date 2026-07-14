import { useState, useEffect, useCallback } from "react"
import { apiFetch } from "../../../lib/apiFetch"
import { useAuthStore } from "../../../store/authStore"
import { DEFAULT_PER_PAGE } from "../types"
import type { BookmarkItem, BookmarksPagination, BookmarksResponse } from "../types"

interface UseBookmarksArgs {
  collection: string | null
  tag: string | null
  search: string
  page: number
  perPage?: number
}

const EMPTY_PAGINATION: BookmarksPagination = { page: 1, per_page: DEFAULT_PER_PAGE, total: 0 }

export function useBookmarks({ collection, tag, search, page, perPage = DEFAULT_PER_PAGE }: UseBookmarksArgs) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const [bookmarks, setBookmarks]   = useState<BookmarkItem[]>([])
  const [pagination, setPagination] = useState<BookmarksPagination>(EMPTY_PAGINATION)
  const [isLoading, setIsLoading]   = useState(false)
  const [error, setError]           = useState<string | null>(null)

  const fetchBookmarks = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      // page/per_page van siempre: sin 'page' el backend responde el shape
      // legacy {results,count,bookmarks} SIN clave 'pagination'.
      params.set("page", String(page))
      params.set("per_page", String(perPage))
      if (collection) params.set("collection", collection)
      if (tag) params.set("tag", tag)
      if (search.trim()) params.set("search", search.trim())

      const res = await apiFetch(`/api/v1/app/bookmarks/?${params}`, { signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data: BookmarksResponse = await res.json()
      setBookmarks(data.bookmarks ?? [])
      setPagination(data.pagination ?? { ...EMPTY_PAGINATION, per_page: perPage })
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") return
      setError(err instanceof Error ? err.message : "Error al cargar bookmarks")
    } finally {
      setIsLoading(false)
    }
  }, [collection, tag, search, page, perPage])

  useEffect(() => {
    if (!isAuthenticated) {
      setBookmarks([])
      setPagination(EMPTY_PAGINATION)
      setError(null)
      return
    }
    const controller = new AbortController()
    fetchBookmarks(controller.signal)
    return () => controller.abort()
  }, [fetchBookmarks, isAuthenticated])

  const refetch = useCallback(() => fetchBookmarks(), [fetchBookmarks])

  return { bookmarks, pagination, isLoading, error, refetch }
}
