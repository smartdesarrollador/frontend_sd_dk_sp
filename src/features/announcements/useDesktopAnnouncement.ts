import { useState, useEffect } from "react"
import { apiFetch } from "../../lib/apiFetch"
import { useAuthStore } from "../../store/authStore"

export interface DesktopAnnouncement {
  id: string
  title: string
  message: string
  image_url: string | null
  cta_text: string
  cta_url: string
  ends_at: string | null
}

function loadDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem("desktop-announcements-dismissed")
    if (raw) return new Set(JSON.parse(raw) as string[])
  } catch { /* ignore */ }
  return new Set()
}

/**
 * Normaliza la respuesta a un array de anuncios. El endpoint devuelve un array
 * plano, pero blindamos contra otras formas (p. ej. respuesta paginada
 * `{ results: [...] }` de DRF CursorPagination) para que un cambio en el backend
 * nunca provoque `announcements.filter is not a function` y deje el panel en blanco.
 */
function toAnnouncementArray(data: unknown): DesktopAnnouncement[] {
  if (Array.isArray(data)) return data as DesktopAnnouncement[]
  if (data && typeof data === "object" && Array.isArray((data as { results?: unknown }).results)) {
    return (data as { results: DesktopAnnouncement[] }).results
  }
  return []
}

export function useDesktopAnnouncements() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [announcements, setAnnouncements] = useState<DesktopAnnouncement[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(loadDismissed)

  useEffect(() => {
    if (!isAuthenticated) { setAnnouncements([]); return }
    apiFetch("/api/v1/app/announcements/top/?placement=dashboard&limit=2")
      .then((res) => {
        if (!res.ok) return []
        return res.json()
      })
      .then((data) => setAnnouncements(toAnnouncementArray(data)))
      .catch(() => setAnnouncements([]))
  }, [isAuthenticated])

  function dismiss(id: string) {
    setDismissed((prev) => {
      const next = new Set(prev)
      next.add(id)
      localStorage.setItem("desktop-announcements-dismissed", JSON.stringify([...next]))
      return next
    })
  }

  const visible = announcements.filter((a) => !dismissed.has(a.id))

  return { announcements: visible, dismiss }
}
