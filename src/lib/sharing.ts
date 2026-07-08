import { apiFetch } from './apiFetch'

export type ShareResourceType = 'note' | 'contact' | 'snippet'

export interface TeamMember {
  id: string
  name: string
  email: string
}

export interface ShareRecord {
  id: string
  shared_with_email: string
  shared_with_name: string
  permission_level: string
  created_at: string
}

async function unwrapOrThrow(res: Response) {
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    const msg = body?.error?.message ?? body?.detail ?? `HTTP ${res.status}`
    throw new Error(msg)
  }
  return res.json()
}

export async function fetchTeamDirectory(): Promise<TeamMember[]> {
  const res = await apiFetch('/api/v1/app/team/directory/')
  const data = await unwrapOrThrow(res)
  return data.members ?? []
}

export async function fetchResourceShares(
  resourceType: ShareResourceType,
  resourceId: string,
): Promise<ShareRecord[]> {
  const params = new URLSearchParams({ resource_type: resourceType, resource_id: resourceId })
  const res = await apiFetch(`/api/v1/app/sharing/?${params.toString()}`)
  const data = await unwrapOrThrow(res)
  return data.shares ?? []
}

export async function createShare(
  resourceType: ShareResourceType,
  resourceId: string,
  email: string,
): Promise<ShareRecord> {
  const res = await apiFetch('/api/v1/app/sharing/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resource_type: resourceType,
      resource_id: resourceId,
      shared_with_email: email,
      permission_level: 'viewer',
    }),
  })
  return unwrapOrThrow(res)
}

export async function revokeShare(shareId: string): Promise<void> {
  const res = await apiFetch(`/api/v1/app/sharing/${shareId}/delete/`, { method: 'DELETE' })
  if (!res.ok && res.status !== 204) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error?.message ?? `HTTP ${res.status}`)
  }
}
