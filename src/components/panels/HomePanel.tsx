import { useState, useEffect, useCallback, useMemo } from "react"
import {
  Lock, Files, MessageSquare, Bell, Code2, CheckSquare,
  StickyNote, Users, Bookmark, FolderKanban, CalendarDays,
  User, Settings, Pencil, X, ChevronRight, ExternalLink, Sparkles, Megaphone,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useAuthStore } from "../../store/authStore"
import { useNotificationsStore } from "../../store/notificationsStore"
import { useNavigationStore } from "../../store/navigationStore"
import { apiFetch } from "../../lib/apiFetch"
import { openExternal } from "../../lib/openExternal"
import type { PanelId } from "../../types"
import { useDesktopAnnouncements, type DesktopAnnouncement } from "../../features/announcements/useDesktopAnnouncement"

// ─── Types ────────────────────────────────────────────────────────────────────
interface HomeEvent   { id: string; title: string; start_datetime: string }
interface HomeTask    { id: string; status: string; due_date: string | null }
interface HomeSnippet { id: string; title: string; language: string; updated_at: string }
// `category` era string; tras la gestión de categorías el backend devuelve un
// objeto {id, name, color, notes_count} (o null). Aceptamos ambas formas.
interface HomeNoteCategory { id: string; name: string; color: string | null; notes_count?: number }
interface HomeNote    { id: string; title: string; category: HomeNoteCategory | string | null; updated_at: string }

// ─── Constants ────────────────────────────────────────────────────────────────
const QUOTES = [
  "La disciplina es el puente entre las metas y los logros.",
  "Haz hoy lo que otros no harán para tener mañana lo que otros no tendrán.",
  "El éxito no es definitivo; el fracaso no es fatal. Lo que cuenta es el valor de continuar.",
  "Cada gran logro fue en algún momento considerado imposible.",
  "No cuentes los días, haz que los días cuenten.",
  "La productividad no se trata de hacer más cosas — es de hacer las cosas correctas.",
  "Empieza donde estás. Usa lo que tienes. Haz lo que puedes.",
  "El trabajo en equipo hace que los sueños funcionen.",
  "No esperes el momento perfecto. Toma el momento y hazlo perfecto.",
  "Pequeños progresos diarios llevan a grandes resultados.",
  "La clave no es priorizar tu agenda, sino agendarizar tus prioridades.",
  "La mejor forma de predecir el futuro es crearlo.",
  "Un buen sistema hoy supera un plan perfecto mañana.",
  "Lo que no se mide no se puede mejorar.",
  "Haz algo hoy que tu yo del futuro te agradecerá.",
]

const PLAN_STYLES: Record<string, string> = {
  free:         "bg-gray-700/60 text-gray-300",
  starter:      "bg-blue-900/50 text-blue-300",
  professional: "bg-purple-900/50 text-purple-300",
  enterprise:   "bg-yellow-900/40 text-yellow-300",
}

const PLAN_LABELS: Record<string, string> = {
  free:         "Free",
  starter:      "Starter",
  professional: "Professional",
  enterprise:   "Enterprise",
}

const PANEL_META: Partial<Record<PanelId, { label: string; icon: LucideIcon }>> = {
  files:     { label: "Files",      icon: Files },
  chat:      { label: "Chat",       icon: MessageSquare },
  alerts:    { label: "Alertas",    icon: Bell },
  snippets:  { label: "Snippets",   icon: Code2 },
  tasks:     { label: "Tareas",     icon: CheckSquare },
  notes:     { label: "Notas",      icon: StickyNote },
  contacts:  { label: "Contactos",  icon: Users },
  bookmarks: { label: "Bookmarks",  icon: Bookmark },
  projects:  { label: "Proyectos",  icon: FolderKanban },
  calendar:  { label: "Calendario", icon: CalendarDays },
  services:  { label: "Servicios",   icon: Sparkles },
  profile:   { label: "Perfil",     icon: User },
  settings:  { label: "Settings",   icon: Settings },
}

const SHORTCUTTABLE_PANELS = Object.keys(PANEL_META) as PanelId[]
const DEFAULT_SHORTCUTS: PanelId[] = ["tasks", "notes", "calendar", "snippets"]
const MAX_SHORTCUTS = 6

// ─── Helpers ──────────────────────────────────────────────────────────────────
// Extrae un array de la respuesta sin importar la forma: array plano, `{results}`
// (DRF CursorPagination) o claves específicas. Evita que una respuesta inesperada
// del backend rompa un `.filter`/`.map` en render y deje el panel en blanco.
function toArray<T>(data: unknown, ...keys: string[]): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === "object") {
    for (const key of [...keys, "results"]) {
      const val = (data as Record<string, unknown>)[key]
      if (Array.isArray(val)) return val as T[]
    }
  }
  return []
}

function startOfDay(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()) }

function isTodayOrTomorrow(dateStr: string): boolean {
  const d = startOfDay(new Date(dateStr))
  const today = startOfDay(new Date())
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  return d.getTime() === today.getTime() || d.getTime() === tomorrow.getTime()
}

function isUrgentTask(dueDate: string | null): boolean {
  if (!dueDate) return false
  const d = startOfDay(new Date(dueDate))
  const in2Days = startOfDay(new Date()); in2Days.setDate(in2Days.getDate() + 2)
  return d <= in2Days
}

function getGreeting(): string {
  const h = new Date().getHours()
  return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches"
}

function getTodayString(): string {
  return new Date().toLocaleDateString("es", { weekday: "long", day: "2-digit", month: "long" })
}

function formatRelative(iso: string): string {
  const diffDays = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (diffDays === 0) return "Hoy"
  if (diffDays === 1) return "Ayer"
  if (diffDays < 7)  return `Hace ${diffDays} días`
  return new Date(iso).toLocaleDateString("es", { day: "2-digit", month: "short" })
}

// Nunca renderizar `category` directo: si llega como objeto, React lanza
// "Objects are not valid as a React child" y tumba el panel entero.
function categoryLabel(category: HomeNote["category"]): string {
  if (typeof category === "string") return category
  return category?.name ?? "Sin categoría"
}

function getTodayKey(): string { return new Date().toISOString().slice(0, 10) }

function isTodayDismissed(): boolean {
  return localStorage.getItem("desktop-home-quote-dismissed") === getTodayKey()
}

function loadShortcuts(): PanelId[] {
  try {
    const raw = localStorage.getItem("desktop-home-shortcuts")
    if (raw) return JSON.parse(raw) as PanelId[]
  } catch { /* ignore */ }
  return DEFAULT_SHORTCUTS
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatCard({
  icon: Icon, count, label, color, onClick,
}: {
  icon: LucideIcon; count: number; label: string; color: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-1 flex-col items-center gap-1.5 rounded-lg bg-white/5 px-2 py-3 transition-colors hover:bg-white/10 active:bg-white/15"
    >
      <Icon size={17} className={color} />
      <span className={`text-base font-bold leading-none ${color}`}>{count}</span>
      <span className="text-[9px] text-gray-500 text-center leading-tight">{label}</span>
    </button>
  )
}

function RecentCard({
  icon: Icon, title, meta, metaStyle, date, onClick,
}: {
  icon: LucideIcon; title: string; meta: string; metaStyle: string; date: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg bg-white/5 px-3 py-2.5 text-left transition-colors hover:bg-white/10 active:bg-white/15"
    >
      <Icon size={15} className="shrink-0 text-gray-500" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-gray-200">{title}</p>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className={`rounded px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${metaStyle}`}>
            {meta}
          </span>
          <span className="text-[10px] text-gray-600">{date}</span>
        </div>
      </div>
      <ChevronRight size={11} className="shrink-0 text-gray-600" />
    </button>
  )
}

function AnnouncementCard({
  announcement,
  onDismiss,
}: {
  announcement: DesktopAnnouncement
  onDismiss: () => void
}) {
  function formatEnd(iso: string) {
    return new Date(iso).toLocaleDateString("es", { day: "2-digit", month: "short" })
  }
  return (
    <div className="overflow-hidden rounded-lg bg-white/5">

      {/* Imagen full-width con margen */}
      <div className="px-2 pt-2">
        {announcement.image_url ? (
          <img
            src={announcement.image_url}
            alt=""
            className="h-24 w-full rounded-md object-cover"
          />
        ) : (
          <div className="flex h-16 w-full items-center justify-center rounded-md bg-amber-500/15">
            <Megaphone size={22} className="text-amber-400" />
          </div>
        )}
      </div>

      {/* Texto debajo de la imagen */}
      <div className="px-3 pb-2.5 pt-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-semibold leading-tight text-gray-200">{announcement.title}</p>
          <button
            onClick={onDismiss}
            title="Descartar"
            className="mt-0.5 shrink-0 rounded p-0.5 text-gray-600 transition-colors hover:text-gray-400"
          >
            <X size={11} />
          </button>
        </div>

        {announcement.message && (
          <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-gray-400">
            {announcement.message}
          </p>
        )}

        <div className="mt-1.5 flex items-center justify-between gap-2">
          {announcement.ends_at ? (
            <span className="text-[9px] text-gray-600">
              Hasta {formatEnd(announcement.ends_at)}
            </span>
          ) : (
            <span />
          )}
          {announcement.cta_url && announcement.cta_text && (
            <button
              onClick={() => openExternal(announcement.cta_url)}
              className="flex items-center gap-1 text-[10px] font-medium text-amber-400 transition-colors hover:text-amber-300"
            >
              {announcement.cta_text}
              <ExternalLink size={9} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function HomePanel() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user            = useAuthStore((s) => s.user)
  const tenant          = useAuthStore((s) => s.tenant)
  const unreadCount     = useNotificationsStore((s) => s.unreadCount)
  const navigateTo      = useNavigationStore((s) => s.navigateTo)

  const [homeEvents,    setHomeEvents]    = useState<HomeEvent[]>([])
  const [homeTasks,     setHomeTasks]     = useState<HomeTask[]>([])
  const [lastSnippet,   setLastSnippet]   = useState<HomeSnippet | null>(null)
  const [lastNote,      setLastNote]      = useState<HomeNote | null>(null)
  const [isLoading,     setIsLoading]     = useState(false)
  const [shortcuts,     setShortcuts]     = useState<PanelId[]>(loadShortcuts)
  const [editShortcuts, setEditShortcuts] = useState(false)
  const [quoteVisible,  setQuoteVisible]  = useState(() => !isTodayDismissed())

  const { announcements, dismiss } = useDesktopAnnouncements()

  const todayEvents = useMemo(
    () => homeEvents.filter((e) => isTodayOrTomorrow(e.start_datetime)),
    [homeEvents],
  )
  const urgentTasks = useMemo(
    () => homeTasks.filter((t) => t.status !== "done" && isUrgentTask(t.due_date)),
    [homeTasks],
  )
  const dailyQuote = useMemo(
    () => QUOTES[Math.floor(Date.now() / 86_400_000) % QUOTES.length],
    [],
  )

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return
    setIsLoading(true)
    const [calRes, taskRes, snippetRes, noteRes] = await Promise.allSettled([
      apiFetch("/api/v1/app/calendar/"),
      apiFetch("/api/v1/app/tasks/"),
      apiFetch("/api/v1/app/snippets/"),
      apiFetch("/api/v1/app/notes/"),
    ])
    if (calRes.status === "fulfilled" && calRes.value.ok) {
      const d = await calRes.value.json()
      setHomeEvents(toArray<HomeEvent>(d, "events"))
    }
    if (taskRes.status === "fulfilled" && taskRes.value.ok) {
      const d = await taskRes.value.json()
      setHomeTasks(toArray<HomeTask>(d, "tasks"))
    }
    if (snippetRes.status === "fulfilled" && snippetRes.value.ok) {
      const d = await snippetRes.value.json()
      const items = toArray<HomeSnippet>(d, "snippets")
      setLastSnippet(items[0] ?? null)
    }
    if (noteRes.status === "fulfilled" && noteRes.value.ok) {
      const d = await noteRes.value.json()
      const items = toArray<HomeNote>(d, "notes")
      setLastNote(items[0] ?? null)
    }
    setIsLoading(false)
  }, [isAuthenticated])

  useEffect(() => {
    if (isAuthenticated) {
      fetchData()
    } else {
      setHomeEvents([]); setHomeTasks([]); setLastSnippet(null); setLastNote(null)
    }
  }, [isAuthenticated, fetchData])

  function toggleShortcut(panel: PanelId) {
    setShortcuts((prev) => {
      const next = prev.includes(panel)
        ? prev.filter((p) => p !== panel)
        : prev.length < MAX_SHORTCUTS ? [...prev, panel] : prev
      localStorage.setItem("desktop-home-shortcuts", JSON.stringify(next))
      return next
    })
  }

  function dismissQuote() {
    localStorage.setItem("desktop-home-quote-dismissed", getTodayKey())
    setQuoteVisible(false)
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <Lock size={32} className="text-gray-600" />
        <p className="text-sm text-gray-400">Inicia sesión para ver tu panel de inicio</p>
      </div>
    )
  }

  const planStyle  = PLAN_STYLES[tenant?.plan ?? ""] ?? PLAN_STYLES.free
  const planLabel  = PLAN_LABELS[tenant?.plan ?? ""] ?? "Free"
  const isPaidPlan = (tenant?.plan ?? "free") !== "free"
  const firstName  = user?.name?.split(" ")[0] ?? ""

  return (
    <div className="flex h-full flex-col overflow-y-auto">

      {/* ── Header ── */}
      <header className="shrink-0 border-b border-white/10 px-4 py-3">
        <p className="text-[10px] capitalize text-gray-600">{getTodayString()}</p>
        <h2 className="mt-0.5 text-sm font-semibold text-gray-100">
          {getGreeting()}{firstName ? `, ${firstName}` : ""}
        </h2>
      </header>

      <div className="flex flex-col gap-4 p-3">

        {/* ── Widget de estado ── */}
        <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-gray-200">{tenant?.name ?? "Workspace"}</p>
            <p className="text-[10px] text-gray-500">{user?.roles?.[0] ?? "Miembro"}</p>
          </div>
          <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${planStyle}`}>
            {planLabel}
          </span>
          <button
            onClick={() => openExternal("https://digisider.com")}
            title="digisider.com"
            className="shrink-0 rounded p-0.5 text-gray-700 transition-colors hover:text-gray-400 hover:bg-white/10"
          >
            <ExternalLink size={11} />
          </button>
        </div>

        {/* ── Resumen del día ── */}
        <section>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-600">
            Resumen del día
          </p>
          {isLoading ? (
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-[72px] animate-pulse rounded-lg bg-white/5" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <StatCard
                icon={CalendarDays}
                count={todayEvents.length}
                label="Eventos hoy/mañana"
                color={todayEvents.length > 0 ? "text-blue-400" : "text-gray-600"}
                onClick={() => navigateTo("calendar")}
              />
              <StatCard
                icon={CheckSquare}
                count={urgentTasks.length}
                label="Tareas urgentes"
                color={urgentTasks.length > 0 ? "text-orange-400" : "text-gray-600"}
                onClick={() => navigateTo("tasks")}
              />
              <StatCard
                icon={Bell}
                count={unreadCount}
                label="Alertas sin leer"
                color={unreadCount > 0 ? "text-red-400" : "text-gray-600"}
                onClick={() => navigateTo("alerts")}
              />
            </div>
          )}
        </section>

        {/* ── Accesos rápidos ── */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-600">
              Accesos rápidos
            </p>
            <button
              onClick={() => setEditShortcuts((v) => !v)}
              className="rounded p-1 text-gray-600 transition-colors hover:bg-white/10 hover:text-gray-300"
              title={editShortcuts ? "Listo" : "Editar atajos"}
            >
              {editShortcuts ? <X size={11} /> : <Pencil size={11} />}
            </button>
          </div>

          {editShortcuts ? (
            <>
              <p className="mb-1.5 text-[9px] text-gray-600">
                Selecciona hasta {MAX_SHORTCUTS} ({shortcuts.length}/{MAX_SHORTCUTS})
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {SHORTCUTTABLE_PANELS.map((panelId) => {
                  const meta = PANEL_META[panelId]!
                  const Icon = meta.icon
                  const isSelected = shortcuts.includes(panelId)
                  const isDisabled = !isSelected && shortcuts.length >= MAX_SHORTCUTS
                  return (
                    <button
                      key={panelId}
                      onClick={() => { if (!isDisabled) toggleShortcut(panelId) }}
                      className={`flex flex-col items-center gap-1 rounded-lg px-1 py-2 text-[10px] transition-colors ${
                        isSelected
                          ? "bg-blue-600/20 text-blue-300 ring-1 ring-blue-600/40"
                          : isDisabled
                            ? "cursor-not-allowed bg-white/5 text-gray-700"
                            : "bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300"
                      }`}
                    >
                      <Icon size={14} />
                      <span className="w-full truncate text-center">{meta.label}</span>
                    </button>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {shortcuts.map((panelId) => {
                const meta = PANEL_META[panelId]
                if (!meta) return null
                const Icon = meta.icon
                const badge =
                  panelId === "alerts" ? unreadCount :
                  panelId === "tasks"  ? urgentTasks.length : 0
                return (
                  <button
                    key={panelId}
                    onClick={() => navigateTo(panelId)}
                    className="relative flex flex-col items-center gap-1 rounded-lg bg-white/5 px-1 py-2.5 text-[10px] text-gray-400 transition-colors hover:bg-white/10 hover:text-gray-200 active:bg-white/15"
                  >
                    {badge > 0 && (
                      <span className="pointer-events-none absolute right-1 top-1 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-red-500 px-0.5 text-[8px] font-bold leading-none text-white">
                        {badge > 99 ? "99+" : badge}
                      </span>
                    )}
                    <Icon size={16} />
                    <span className="w-full truncate text-center">{meta.label}</span>
                  </button>
                )
              })}
            </div>
          )}
        </section>

        {/* ── Banner Servicios Digitales ── */}
        <div className="flex items-start gap-3 rounded-lg bg-white/5 px-3 py-3">
          <Sparkles size={18} className="mt-0.5 shrink-0 text-purple-400" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-gray-200">
              {isPaidPlan ? "Servicios Digitales" : "¿Necesitás crecer online?"}
            </p>
            <p className="mt-0.5 text-[10px] leading-relaxed text-gray-500">
              {isPaidPlan
                ? "Complementá tu plan con páginas web, marketing y automatizaciones."
                : "Páginas web, marketing digital y automatizaciones para tu negocio."}
            </p>
          </div>
          <button
            onClick={() => navigateTo("services")}
            className="mt-0.5 shrink-0 whitespace-nowrap rounded-md border border-purple-500/30 bg-purple-600/20 px-2.5 py-1.5 text-[10px] font-medium text-purple-300 transition-colors hover:bg-purple-600/30 hover:text-purple-200"
          >
            Ver servicios
          </button>
        </div>

        {/* ── Anuncios ── */}
        {announcements.length > 0 && (
          <section>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-600">
              Anuncios
            </p>
            <div className="flex flex-col gap-2">
              {announcements.map((a) => (
                <AnnouncementCard key={a.id} announcement={a} onDismiss={() => dismiss(a.id)} />
              ))}
            </div>
          </section>
        )}

        {/* ── Continuá donde lo dejaste ── */}
        {(lastSnippet || lastNote) && (
          <section>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-600">
              Continuá donde lo dejaste
            </p>
            <div className="flex flex-col gap-1.5">
              {lastSnippet && (
                <RecentCard
                  icon={Code2}
                  title={lastSnippet.title}
                  meta={lastSnippet.language}
                  metaStyle="bg-blue-900/40 text-blue-300"
                  date={formatRelative(lastSnippet.updated_at)}
                  onClick={() => navigateTo("snippets")}
                />
              )}
              {lastNote && (
                <RecentCard
                  icon={StickyNote}
                  title={lastNote.title}
                  meta={categoryLabel(lastNote.category)}
                  metaStyle="bg-green-900/40 text-green-300"
                  date={formatRelative(lastNote.updated_at)}
                  onClick={() => navigateTo("notes")}
                />
              )}
            </div>
          </section>
        )}

        {/* ── Cita motivacional ── */}
        {quoteVisible && (
          <div className="relative rounded-lg bg-white/5 px-3 py-3">
            <button
              onClick={dismissQuote}
              className="absolute right-2 top-2 rounded p-0.5 text-gray-600 transition-colors hover:text-gray-400"
              title="Descartar para hoy"
            >
              <X size={11} />
            </button>
            <p className="pr-5 text-[11px] italic leading-relaxed text-gray-500">
              "{dailyQuote}"
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
