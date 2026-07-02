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

export function useDesktopAnnouncements() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [announcements, setAnnouncements] = useState<DesktopAnnouncement[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(loadDismissed)

  useEffect(() => {
    if (!isAuthenticated) { setAnnouncements([]); return }
    apiFetch("/api/v1/app/announcements/top/?placement=dashboard&limit=2")
      .then((res) => {
        if (!res.ok) return []
        return res.json() as Promise<DesktopAnnouncement[]>
      })
      .then((data) => setAnnouncements(data ?? []))
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
