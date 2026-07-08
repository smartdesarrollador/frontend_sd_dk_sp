import { apiFetch } from './apiFetch'

export interface VaultShareRecord {
  id: string
  shared_with_email: string
  shared_with_name: string
  created_at: string
}

async function extractErrorMessage(res: Response): Promise<string> {
  if (res.status === 402) {
    return 'Para compartir necesitas un plan superior. Actualiza tu plan para desbloquear esta función.'
  }
  const body = await res.json().catch(() => null)
  return body?.error?.message ?? body?.detail ?? `HTTP ${res.status}`
}

export async function fetchVaultItemShares(itemId: string): Promise<VaultShareRecord[]> {
  const res = await apiFetch(`/api/v1/app/vault/items/${itemId}/share/`)
  if (!res.ok) throw new Error(await extractErrorMessage(res))
  const data = await res.json()
  return data.shares ?? []
}

export async function shareVaultItem(itemId: string, email: string): Promise<VaultShareRecord> {
  const res = await apiFetch(`/api/v1/app/vault/items/${itemId}/share/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shared_with_email: email }),
  })
  if (!res.ok) throw new Error(await extractErrorMessage(res))
  return res.json()
}

export async function revokeVaultShare(itemId: string, shareId: string): Promise<void> {
  const res = await apiFetch(`/api/v1/app/vault/items/${itemId}/share/${shareId}/`, {
    method: 'DELETE',
  })
  if (!res.ok && res.status !== 204) {
    throw new Error(await extractErrorMessage(res))
  }
}
