import { useState, useCallback, useEffect } from 'react'
import { apiFetch } from '../../../lib/apiFetch'
import { useVaultStore } from '../../../store/vaultStore'
import { DEFAULT_PER_PAGE } from '../types'
import type { VaultItem, VaultItemsFilters, VaultItemsPagination, VaultItemsResponse } from '../types'

const EMPTY_PAGINATION: VaultItemsPagination = { page: 1, per_page: DEFAULT_PER_PAGE, total: 0 }

export function useVaultItems(filters: VaultItemsFilters & { page: number; perPage?: number }) {
  const { search, item_type, page, perPage = DEFAULT_PER_PAGE } = filters
  const [items, setItems] = useState<VaultItem[]>([])
  const [pagination, setPagination] = useState<VaultItemsPagination>(EMPTY_PAGINATION)
  const [loading, setLoading] = useState(true)

  // Subscribe to actual values so refetch re-runs when the vault is unlocked
  const unlockToken = useVaultStore((s) => s.unlockToken)
  const expiresAt = useVaultStore((s) => s.expiresAt)
  const isUnlocked = Boolean(unlockToken && expiresAt && Date.now() < expiresAt)

  const refetch = useCallback(async (signal?: AbortSignal) => {
    if (!isUnlocked) { setLoading(false); return }
    setLoading(true)
    try {
      const params = new URLSearchParams()
      // page/per_page van siempre: sin 'page' el backend responde el shape
      // legacy {items, count} SIN clave 'pagination'.
      params.set('page', String(page))
      params.set('per_page', String(perPage))
      if (search) params.set('search', search)
      if (item_type) params.set('item_type', item_type)
      const res = await apiFetch(`/api/v1/app/vault/items/?${params}`, { signal })
      if (!res.ok) return
      const raw: VaultItemsResponse = await res.json()
      setItems(raw.items ?? [])
      setPagination(raw.pagination ?? { ...EMPTY_PAGINATION, per_page: perPage })
    } catch (err) {
      if ((err as { name?: string })?.name !== 'AbortError') { /* ignore, same as original */ }
    } finally {
      setLoading(false)
    }
  }, [isUnlocked, search, item_type, page, perPage])

  useEffect(() => {
    const controller = new AbortController()
    refetch(controller.signal)
    return () => controller.abort()
  }, [refetch])

  return { items, pagination, loading, refetch }
}
