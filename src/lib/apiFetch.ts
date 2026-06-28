import { useAuthStore } from '../store/authStore'
import { useVaultStore } from '../store/vaultStore'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://rbac.local.test'

let isRefreshing = false
type QueueItem = { resolve: (token: string) => void; reject: (err: unknown) => void }
let failedQueue: QueueItem[] = []

function processQueue(error: unknown, token: string | null = null) {
  for (const item of failedQueue) {
    if (error) item.reject(error)
    else item.resolve(token!)
  }
  failedQueue = []
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = localStorage.getItem('desktop-refreshToken')
  if (!refreshToken) throw new Error('No refresh token available')

  const res = await fetch(`${API_BASE}/api/v1/auth/refresh-token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })

  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`)

  const data = (await res.json()) as { access_token: string; refresh_token: string }
  useAuthStore.getState().setAccessToken(data.access_token, data.refresh_token)
  return data.access_token
}

function buildHeaders(init: RequestInit, token: string | null, tenantSlug: string | undefined, path: string): Headers {
  const headers = new Headers(init.headers as HeadersInit | undefined)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (tenantSlug) headers.set('X-Tenant-Slug', tenantSlug)
  if (path.includes('/vault/')) {
    const { unlockToken, isUnlocked } = useVaultStore.getState()
    if (isUnlocked() && unlockToken) headers.set('X-Vault-Token', unlockToken)
  }
  return headers
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const state = useAuthStore.getState()
  const tenantSlug = state.tenant?.slug

  const headers = buildHeaders(init, state.accessToken, tenantSlug, path)
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers })

  if (res.status !== 401) return res

  // Queue concurrent 401s while a refresh is already in flight
  if (isRefreshing) {
    const newToken = await new Promise<string>((resolve, reject) => {
      failedQueue.push({ resolve, reject })
    })
    const retryHeaders = buildHeaders(init, newToken, tenantSlug, path)
    return fetch(`${API_BASE}${path}`, { ...init, headers: retryHeaders })
  }

  isRefreshing = true
  try {
    const newToken = await refreshAccessToken()
    processQueue(null, newToken)
    const retryHeaders = buildHeaders(init, newToken, tenantSlug, path)
    return fetch(`${API_BASE}${path}`, { ...init, headers: retryHeaders })
  } catch (err) {
    processQueue(err, null)
    useAuthStore.getState().clearAuth()
    throw err
  } finally {
    isRefreshing = false
  }
}
