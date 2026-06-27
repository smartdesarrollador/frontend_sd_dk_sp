import { useState, useCallback } from 'react'
import { apiFetch } from '../../../lib/apiFetch'

export function useInviteConnection(onSuccess?: () => void) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const invite = useCallback(async (email: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch('/api/v1/app/chat/connections/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as Record<string, unknown>
        setError((body.detail as string) ?? 'Error enviando invitación')
        return
      }
      onSuccess?.()
    } catch {
      setError('Error de red')
    } finally {
      setLoading(false)
    }
  }, [onSuccess])

  return { invite, loading, error }
}
