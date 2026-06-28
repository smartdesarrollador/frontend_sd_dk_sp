import { useCallback } from 'react'
import { apiFetch } from '../../../lib/apiFetch'
import type { VaultItemRevealed, CreateVaultItemRequest, UpdateVaultItemRequest } from '../types'

export function useVaultItemMutations(refetchItems: () => void) {
  const reveal = useCallback(async (id: string): Promise<VaultItemRevealed | null> => {
    try {
      const res = await apiFetch(`/api/v1/app/vault/items/${id}/`)
      if (!res.ok) return null
      return (await res.json()) as VaultItemRevealed
    } catch {
      return null
    }
  }, [])

  const create = useCallback(async (payload: CreateVaultItemRequest): Promise<boolean> => {
    try {
      const res = await apiFetch('/api/v1/app/vault/items/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) return false
      refetchItems()
      return true
    } catch {
      return false
    }
  }, [refetchItems])

  const update = useCallback(async (id: string, payload: UpdateVaultItemRequest): Promise<boolean> => {
    try {
      const res = await apiFetch(`/api/v1/app/vault/items/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) return false
      refetchItems()
      return true
    } catch {
      return false
    }
  }, [refetchItems])

  const remove = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await apiFetch(`/api/v1/app/vault/items/${id}/`, { method: 'DELETE' })
      if (!res.ok) return false
      refetchItems()
      return true
    } catch {
      return false
    }
  }, [refetchItems])

  return { reveal, create, update, remove }
}
