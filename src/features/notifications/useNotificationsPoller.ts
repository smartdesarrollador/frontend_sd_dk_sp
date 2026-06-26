import { useEffect, useRef } from "react"
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification"
import { useAuthStore } from "../../store/authStore"
import { useNotificationsStore } from "../../store/notificationsStore"
import { apiFetch } from "../../lib/apiFetch"
import type { PanelId } from "../../types"

const POLL_INTERVAL_MS = 60_000

interface RawNotification {
  id: string
  title: string
  message: string
  read: boolean
}

export function useNotificationsPoller(activePanel: PanelId | null) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const setUnreadCount  = useNotificationsStore((s) => s.setUnreadCount)
  const knownIds        = useRef<Set<string>>(new Set())
  const activePanelRef  = useRef<PanelId | null>(activePanel)

  // Keep ref in sync without re-creating the interval
  useEffect(() => {
    activePanelRef.current = activePanel
  }, [activePanel])

  useEffect(() => {
    if (!isAuthenticated) {
      knownIds.current.clear()
      setUnreadCount(0)
      return
    }

    async function poll() {
      try {
        const res = await apiFetch("/api/v1/app/notifications/")
        if (!res.ok) return
        const data = await res.json()
        const notifications: RawNotification[] = data.notifications ?? data.results ?? []

        const unread = notifications.filter((n) => !n.read)
        setUnreadCount(unread.length)

        // Find genuinely new unread notifications (not seen in previous polls)
        const newUnread = unread.filter((n) => !knownIds.current.has(n.id))

        // Register all current IDs so next poll knows the baseline
        notifications.forEach((n) => knownIds.current.add(n.id))

        // Fire OS notification only if user is not already on the alerts panel
        if (newUnread.length > 0 && activePanelRef.current !== "alerts") {
          let granted = await isPermissionGranted()
          if (!granted) {
            const permission = await requestPermission()
            granted = permission === "granted"
          }
          if (granted) {
            const first = newUnread[0]
            sendNotification({
              title: first.title,
              body: first.message || `${newUnread.length} nueva${newUnread.length > 1 ? "s" : ""} alerta${newUnread.length > 1 ? "s" : ""}`,
            })
          }
        }
      } catch {
        // Silent failure — next poll will retry
      }
    }

    poll()
    const id = setInterval(poll, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [isAuthenticated, setUnreadCount])
}
