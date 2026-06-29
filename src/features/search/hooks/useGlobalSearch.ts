import { useState, useEffect } from 'react'
import { apiFetch } from '../../../lib/apiFetch'
import type { GlobalSearchResponse, SearchFiltersState } from '../types'

export const MIN_QUERY_LEN = 2

export function useGlobalSearch(query: string, filters: SearchFiltersState) {
  const [data, setData]         = useState<GlobalSearchResponse | null>(null)
  const [isLoading, setLoading] = useState(false)
  const [isError, setError]     = useState(false)

  useEffect(() => {
    const q = query.trim()
    if (q.length < MIN_QUERY_LEN) {
      setData(null)
      setError(false)
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setError(false)

    const params = new URLSearchParams({ q })
    if (filters.types.length > 0) params.set('types', filters.types.join(','))
    if (filters.dateFrom) params.set('date_from', filters.dateFrom)
    if (filters.dateTo)   params.set('date_to', filters.dateTo)

    apiFetch(`/api/v1/app/search/?${params}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((d: GlobalSearchResponse) => {
        setData(d)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if ((err as { name?: string })?.name !== 'AbortError') {
          setError(true)
          setLoading(false)
        }
      })

    return () => controller.abort()
  }, [query, filters])

  return { data, isLoading, isError }
}
