import { useState, useEffect, useCallback, useMemo } from "react"
import {
  Lock, Bell, BellOff, AlertCircle,
  RefreshCw, CheckCheck, Check, Loader2,
} from "lucide-react"
import { useAuthStore } from "../../store/authStore"
import { useNotificationsStore } from "../../store/notificationsStore"
import { apiFetch } from "../../lib/apiFetch"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type NotificationCategory =
  | "security" | "billing" | "system"
  | "users"    | "roles"   | "services"

interface Notification {
  id: string
  category: NotificationCategory
  title: string
  message: string
  icon?: string
  read: boolean
  created_at: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const CATEGORY_STYLES: Record<NotificationCategory, string> = {
  security: "bg-red-900/50 text-red-300",
  billing:  "bg-yellow-900/40 text-yellow-300",
  system:   "bg-gray-700/60 text-gray-300",
  users:    "bg-blue-900/50 text-blue-300",
  roles:    "bg-purple-900/50 text-purple-300",
  services: "bg-teal-900/50 text-teal-300",
}

const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  security: "Seguridad",
  billing:  "Facturación",
  system:   "Sistema",
  users:    "Usuarios",
  roles:    "Roles",
  services: "Servicios",
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(iso: string): string {
  const d = new Date(iso)
  const diffMs = Date.now() - d.getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  if (diffMins < 1)  return "Ahora"
  if (diffMins < 60) return `Hace ${diffMins}m`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24)  return `Hace ${diffHrs}h`
  return d.toLocaleDateString("es", { day: "2-digit", month: "short" })
}

// ---------------------------------------------------------------------------
// NotificationItem
// ---------------------------------------------------------------------------
function NotificationItem({
  notification,
  onMarkRead,
  isMarking,
}: {
  notification: Notification
  onMarkRead: (id: string) => void
  isMarking: boolean
}) {
  const { id, category, title, message, read, created_at } = notification
  const catLabel = CATEGORY_LABELS[category] ?? category
  const catStyle = CATEGORY_STYLES[category] ?? "bg-gray-700/60 text-gray-300"

  return (
    <div className={`relative rounded-md px-3 py-2.5 transition-colors ${read ? "" : "bg-blue-500/5"}`}>
      {/* Unread dot */}
      {!read && (
        <span className="absolute left-1 top-[14px] h-1.5 w-1.5 rounded-full bg-blue-400" />
      )}

      {/* Top row: title + category badge */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className={`text-xs font-semibold leading-tight flex-1 ${read ? "text-gray-400" : "text-gray-100"}`}>
          {title}
        </p>
        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${catStyle}`}>
          {catLabel}
        </span>
      </div>

      {/* Message */}
      {message && (
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-1.5">
          {message}
        </p>
      )}

      {/* Bottom row: date + mark-read button */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] text-gray-600">{formatDate(created_at)}</span>
        {!read && (
          <button
            onClick={() => onMarkRead(id)}
            disabled={isMarking}
            className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 disabled:opacity-40 transition-colors"
            title="Marcar como leída"
          >
            {isMarking
              ? <Loader2 size={10} className="animate-spin" />
              : <Check size={10} />
            }
            Marcar leída
          </button>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
function AlertsSkeleton() {
  return (
    <div className="flex flex-col gap-1 px-3 py-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="py-2.5 space-y-2 animate-pulse">
          <div className="flex items-start justify-between gap-2">
            <div className="h-3 w-2/3 rounded bg-white/10" />
            <div className="h-4 w-16 rounded bg-white/10" />
          </div>
          <div className="h-2.5 w-full rounded bg-white/10" />
          <div className="h-2.5 w-3/4 rounded bg-white/10" />
          <div className="h-2 w-14 rounded bg-white/10" />
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// AlertsPanel
// ---------------------------------------------------------------------------
export default function AlertsPanel() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const setUnreadCount  = useNotificationsStore((s) => s.setUnreadCount)

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading,     setIsLoading]     = useState(false)
  const [error,         setError]         = useState<string | null>(null)
  const [filter,        setFilter]        = useState<"all" | "unread">("all")
  const [markingId,     setMarkingId]     = useState<string | null>(null)
  const [markingAll,    setMarkingAll]    = useState(false)

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  )

  const filtered = useMemo(
    () => filter === "unread" ? notifications.filter((n) => !n.read) : notifications,
    [notifications, filter],
  )

  // Sync unread count to global store → drives badge in IconStrip
  useEffect(() => {
    setUnreadCount(unreadCount)
  }, [unreadCount, setUnreadCount])

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await apiFetch("/api/v1/app/notifications/")
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setNotifications(data.notifications ?? data.results ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar alertas")
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  // Fetch on mount + auto-refresh every 60s
  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([])
      setError(null)
      setUnreadCount(0)
      return
    }
    fetchNotifications()
    const id = setInterval(fetchNotifications, 60_000)
    return () => clearInterval(id)
  }, [isAuthenticated, fetchNotifications, setUnreadCount])

  async function handleMarkRead(id: string) {
    setMarkingId(id)
    try {
      const res = await apiFetch(`/api/v1/app/notifications/${id}/read/`, { method: "POST" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const updated: Notification = await res.json()
      setNotifications((prev) => prev.map((n) => n.id === id ? updated : n))
    } catch (err) {
      console.error("[AlertsPanel] mark read error:", err)
    } finally {
      setMarkingId(null)
    }
  }

  async function handleMarkAllRead() {
    setMarkingAll(true)
    try {
      const res = await apiFetch("/api/v1/app/notifications/read-all/", { method: "POST" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch (err) {
      console.error("[AlertsPanel] mark all read error:", err)
    } finally {
      setMarkingAll(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <Lock size={32} className="text-gray-600" />
        <p className="text-sm text-gray-400">Inicia sesión para ver tus alertas</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="shrink-0 border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-100">Alertas</h2>
            {unreadCount > 0 && (
              <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-600 px-1.5 text-[9px] font-bold leading-none text-white">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="rounded p-1 text-gray-500 hover:text-gray-200 hover:bg-white/10 transition-colors disabled:opacity-40"
                title="Marcar todas como leídas"
              >
                {markingAll
                  ? <Loader2 size={13} className="animate-spin" />
                  : <CheckCheck size={13} />
                }
              </button>
            )}
            <button
              onClick={fetchNotifications}
              disabled={isLoading}
              className="rounded p-1 text-gray-500 hover:text-gray-200 hover:bg-white/10 transition-colors disabled:opacity-40"
              title="Actualizar"
            >
              <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Filter pills */}
        {!isLoading && !error && notifications.length > 0 && (
          <div className="flex gap-1.5 mt-2.5">
            <button
              onClick={() => setFilter("all")}
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-colors ${
                filter === "all"
                  ? "bg-white/15 text-gray-100"
                  : "bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300"
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-colors ${
                filter === "unread"
                  ? "bg-white/15 text-gray-100"
                  : "bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300"
              }`}
            >
              {unreadCount > 0 ? `Sin leer · ${unreadCount}` : "Sin leer"}
            </button>
          </div>
        )}
      </header>

      {isLoading && <AlertsSkeleton />}

      {!isLoading && error && (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
          <AlertCircle size={28} className="text-red-400" />
          <p className="text-sm text-gray-400">{error}</p>
          <button
            onClick={fetchNotifications}
            className="rounded-md bg-white/10 px-3 py-1.5 text-xs text-gray-200 hover:bg-white/20 transition-colors"
          >
            Reintentar
          </button>
        </div>
      )}

      {!isLoading && !error && notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
          <Bell size={32} className="text-gray-600" />
          <p className="text-sm text-gray-400">Sin notificaciones</p>
        </div>
      )}

      {!isLoading && !error && notifications.length > 0 && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
          <BellOff size={28} className="text-gray-500" />
          <p className="text-sm text-gray-400">Todo al día</p>
          <button
            onClick={() => setFilter("all")}
            className="rounded-md bg-white/10 px-3 py-1.5 text-xs text-gray-200 hover:bg-white/20 transition-colors"
          >
            Ver todas
          </button>
        </div>
      )}

      {!isLoading && !error && filtered.length > 0 && (
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {filtered.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onMarkRead={handleMarkRead}
              isMarking={markingId === n.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}
