import { useState, useEffect, useCallback } from "react"
import { apiFetch } from "../../../lib/apiFetch"
import { useAuthStore } from "../../../store/authStore"
import type { ContactGroup } from "../types"

export function useContactGroups() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [groups, setGroups]       = useState<ContactGroup[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchGroups = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true)
    try {
      const res = await apiFetch("/api/v1/app/contacts/groups/", { signal })
      if (!res.ok) return
      const data = await res.json()
      setGroups(data.groups ?? [])
    } catch (err) {
      if ((err as { name?: string })?.name !== "AbortError") setGroups([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      setGroups([])
      return
    }
    const controller = new AbortController()
    fetchGroups(controller.signal)
    return () => controller.abort()
  }, [fetchGroups, isAuthenticated])

  const refetch = useCallback(() => fetchGroups(), [fetchGroups])

  return { groups, isLoading, refetch }
}
