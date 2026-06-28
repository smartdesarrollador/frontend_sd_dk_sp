import { useState, useCallback, useEffect } from 'react'
import { apiFetch } from '../../../lib/apiFetch'
import { useVaultStore } from '../../../store/vaultStore'
import type { VaultItem, VaultItemsFilters } from '../types'

export function useVaultItems(filters: VaultItemsFilters = {}) {
  const [items, setItems] = useState<VaultItem[]>([])
  const [loading, setLoading] = useState(true)

  // Subscribe to actual values so refetch re-runs when the vault is unlocked
  const unlockToken = useVaultStore((s) => s.unlockToken)
  const expiresAt = useVaultStore((s) => s.expiresAt)
  const isUnlocked = Boolean(unlockToken && expiresAt && Date.now() < expiresAt)

  const refetch = useCallback(async () => {
    if (!isUnlocked) { setLoading(false); return }
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.search) params.set('search', filters.search)
      if (filters.item_type) params.set('item_type', filters.item_type)
      const qs = params.toString()
      const res = await apiFetch(`/api/v1/app/vault/items/${qs ? `?${qs}` : ''}`)
      if (!res.ok) return
      const raw = await res.json()
      // Backend returns { items: VaultItem[], count: N } (not DRF's { results: [...] })
      const arr: VaultItem[] = Array.isArray(raw?.items)
        ? raw.items
        : Array.isArray(raw)
          ? raw
          : []
      setItems(arr)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [isUnlocked, filters.search, filters.item_type])

  useEffect(() => { refetch() }, [refetch])

  return { items, loading, refetch }
}
