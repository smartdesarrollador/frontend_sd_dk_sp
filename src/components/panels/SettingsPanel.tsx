import { useState, useEffect } from "react"
import {
  Files, MessageSquare, Bell, Code2, CheckSquare,
  StickyNote, Users, Bookmark, FolderKanban, CalendarDays, User,
  GripVertical, LogOut, Info, Keyboard, Sparkles, RotateCcw,
  Palette, PanelLeft, SlidersHorizontal,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { getVersion } from "@tauri-apps/api/app"
import { INITIAL_SIDEBAR_POSITION, useSettingsStore } from "../../store/settingsStore"
import { useDesktopAuth } from "../../features/auth/useDesktopAuth"
import { apiFetch } from "../../lib/apiFetch"
import type { PanelId } from "../../types"

// ─── Accent options ───────────────────────────────────────────────────────────
const ACCENT_OPTIONS = [
  { value: "blue",   hex: "#2563eb" },
  { value: "purple", hex: "#9333ea" },
  { value: "green",  hex: "#16a34a" },
  { value: "orange", hex: "#f97316" },
  { value: "pink",   hex: "#db2777" },
  { value: "red",    hex: "#dc2626" },
]

// ─── Background options ───────────────────────────────────────────────────────
const BG_OPTIONS = [
  { value: "default",         label: "Default",     preview: "bg-[#13131f]" },
  { value: "dark-blue",       label: "Azul oscuro", preview: "bg-[#0d1117]" },
  { value: "darker",          label: "Más oscuro",  preview: "bg-[#080810]" },
  { value: "gradient-purple", label: "Púrpura",     preview: "bg-gradient-to-b from-[#1a0a2e] to-[#13131f]" },
  { value: "gradient-blue",   label: "Azul",        preview: "bg-gradient-to-b from-[#0a1628] to-[#13131f]" },
  { value: "gradient-teal",   label: "Teal",        preview: "bg-gradient-to-b from-[#0a1a1a] to-[#13131f]" },
]

// ─── Strip (barra lateral) background options ─────────────────────────────────
// Mismas 6 variantes que BG_OPTIONS pero un paso más claras, para conservar el
// contraste barra/panel (default: panel #13131f vs barra #1e1e2e).
const STRIP_BG_OPTIONS = [
  { value: "default",         label: "Default",     preview: "bg-[#1e1e2e]" },
  { value: "dark-blue",       label: "Azul oscuro", preview: "bg-[#161b26]" },
  { value: "darker",          label: "Más oscuro",  preview: "bg-[#101018]" },
  { value: "gradient-purple", label: "Púrpura",     preview: "bg-gradient-to-b from-[#251440] to-[#1e1e2e]" },
  { value: "gradient-blue",   label: "Azul",        preview: "bg-gradient-to-b from-[#122238] to-[#1e1e2e]" },
  { value: "gradient-teal",   label: "Teal",        preview: "bg-gradient-to-b from-[#122626] to-[#1e1e2e]" },
]

// ─── Sidebar position options ─────────────────────────────────────────────────
const POSITION_OPTIONS = [
  { value: "right", label: "Derecha"   },
  { value: "left",  label: "Izquierda" },
] as const

// ─── Refresh interval options ─────────────────────────────────────────────────
const REFRESH_OPTIONS = [
  { value: 30,  label: "30 seg" },
  { value: 60,  label: "1 min"  },
  { value: 120, label: "2 min"  },
  { value: 0,   label: "Manual" },
]

// ─── Panel meta ───────────────────────────────────────────────────────────────
const PANEL_META: Partial<Record<PanelId, { icon: LucideIcon; label: string }>> = {
  files:     { icon: Files,         label: "Files"     },
  chat:      { icon: MessageSquare, label: "Chat"      },
  alerts:    { icon: Bell,          label: "Alertas"   },
  snippets:  { icon: Code2,         label: "Snippets"  },
  tasks:     { icon: CheckSquare,   label: "Tareas"    },
  notes:     { icon: StickyNote,    label: "Notas"     },
  contacts:  { icon: Users,         label: "Contactos" },
  bookmarks: { icon: Bookmark,      label: "Bookmarks" },
  projects:  { icon: FolderKanban,  label: "Proyectos" },
  calendar:  { icon: CalendarDays,  label: "Calendario"},
  services:  { icon: Sparkles,      label: "Servicios" },
}

// ─── Settings tabs ────────────────────────────────────────────────────────────
type SettingsTab = "appearance" | "sidebar" | "behavior" | "session" | "about"

const SETTINGS_TABS: { id: SettingsTab; label: string; icon: LucideIcon }[] = [
  { id: "appearance", label: "Apariencia",     icon: Palette           },
  { id: "sidebar",    label: "Sidebar",        icon: PanelLeft         },
  { id: "behavior",   label: "Comportamiento", icon: SlidersHorizontal },
  { id: "session",    label: "Sesión",         icon: User              },
  { id: "about",      label: "Acerca de",      icon: Info              },
]

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-3 border-b border-white/10 pb-1">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{title}</p>
    </div>
  )
}

export default function SettingsPanel() {
  const { isAuthenticated, user, logout } = useDesktopAuth()

  const {
    accentColor, setAccentColor,
    panelBackground, setPanelBackground,
    stripBackground, setStripBackground,
    sidebarOrder, setSidebarOrder,
    hiddenPanels, toggleHiddenPanel,
    refreshInterval, setRefreshInterval,
    panelWidth, setPanelWidth,
    sidebarPosition, setSidebarPosition,
  } = useSettingsStore()

  const [appVersion,    setAppVersion]    = useState<string>("...")
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [isLoggingOut,  setIsLoggingOut]  = useState(false)
  const [dragIndex,     setDragIndex]     = useState<number | null>(null)
  const [activeTab,     setActiveTab]     = useState<SettingsTab>("appearance")

  // La pestaña Sesión desaparece al hacer logout — volver a Apariencia
  const visibleTabs = SETTINGS_TABS.filter((t) => t.id !== "session" || isAuthenticated)
  const currentTab: SettingsTab =
    !isAuthenticated && activeTab === "session" ? "appearance" : activeTab

  const accentHex = ACCENT_OPTIONS.find((o) => o.value === accentColor)?.hex ?? "#2563eb"

  useEffect(() => {
    getVersion().then(setAppVersion).catch(() => setAppVersion("—"))
  }, [])

  // ─── Drag & drop ────────────────────────────────────────────────────────────
  function onDragStart(e: React.DragEvent, index: number) {
    setDragIndex(index)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", String(index))
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  function onDrop(e: React.DragEvent, dropIndex: number) {
    e.preventDefault()
    if (dragIndex === null || dragIndex === dropIndex) { setDragIndex(null); return }
    const next = [...sidebarOrder]
    const [moved] = next.splice(dragIndex, 1)
    next.splice(dropIndex, 0, moved)
    setSidebarOrder(next)
    setDragIndex(null)
  }

  function onDragEnd() { setDragIndex(null) }

  // ─── Logout ─────────────────────────────────────────────────────────────────
  async function handleLogout() {
    setIsLoggingOut(true)
    try {
      const refreshToken = localStorage.getItem("desktop-refreshToken")
      if (refreshToken) {
        await apiFetch("/api/v1/auth/logout/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        }).catch(() => {})
      }
      await logout()
    } finally {
      setIsLoggingOut(false)
      setConfirmLogout(false)
    }
  }

  // Home, Perfil y Settings viven anclados en la zona fija inferior de la
  // barra — no se reordenan ni se ocultan desde aquí
  const draggableOrder = sidebarOrder.filter(
    (id) => id !== "settings" && id !== "home" && id !== "profile"
  )

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 border-b border-white/10 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-100">Configuración</h2>
      </header>

      {/* Tab bar (ícono + tooltip) */}
      <div className="shrink-0 border-b border-white/10 flex gap-1 px-2 py-2">
        {visibleTabs.map(({ id, label, icon: Icon }) => (
          <div key={id} className="relative group flex-1">
            <button
              onClick={() => setActiveTab(id)}
              aria-label={label}
              className={`flex w-full items-center justify-center rounded px-1 py-1.5 transition-colors ${
                currentTab === id
                  ? "text-gray-100"
                  : "text-gray-500 hover:bg-white/5 hover:text-gray-300"
              }`}
              style={currentTab === id ? { backgroundColor: `${accentHex}33` } : undefined}
            >
              <Icon size={15} />
            </button>
            <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-gray-200 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              {label}
            </span>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3">

        {/* ── A. Apariencia ─────────────────────────────────────────────────── */}
        {currentTab === "appearance" && (
        <section>
          <SectionHeader title="Apariencia" />

          {/* Color de acento */}
          <div className="mb-4">
            <p className="mb-2 text-xs text-gray-400">Color de acento</p>
            <div className="flex gap-2.5">
              {ACCENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setAccentColor(opt.value)}
                  title={opt.value}
                  style={{ backgroundColor: opt.hex }}
                  className={`h-7 w-7 rounded-full transition-all ${
                    accentColor === opt.value
                      ? "ring-2 ring-white ring-offset-2 ring-offset-[#13131f] scale-110"
                      : "hover:scale-105 opacity-70 hover:opacity-100"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Fondo del panel */}
          <div className="mb-4">
            <p className="mb-2 text-xs text-gray-400">Fondo del panel</p>
            <div className="grid grid-cols-3 gap-2">
              {BG_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPanelBackground(opt.value)}
                  title={opt.label}
                  className={`relative h-10 rounded-md ${opt.preview} border transition-all ${
                    panelBackground === opt.value
                      ? "border-white/40 scale-[1.04]"
                      : "border-white/10 hover:border-white/25"
                  }`}
                >
                  <span className="absolute inset-x-0 bottom-0.5 text-center text-[8px] text-white/50 leading-none">
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Fondo de la barra lateral */}
          <div>
            <p className="mb-2 text-xs text-gray-400">Fondo de la barra lateral</p>
            <div className="grid grid-cols-3 gap-2">
              {STRIP_BG_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStripBackground(opt.value)}
                  title={opt.label}
                  className={`relative h-10 rounded-md ${opt.preview} border transition-all ${
                    stripBackground === opt.value
                      ? "border-white/40 scale-[1.04]"
                      : "border-white/10 hover:border-white/25"
                  }`}
                >
                  <span className="absolute inset-x-0 bottom-0.5 text-center text-[8px] text-white/50 leading-none">
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
        )}

        {/* ── B. Sidebar ────────────────────────────────────────────────────── */}
        {currentTab === "sidebar" && (
        <section>
          <SectionHeader title="Sidebar" />
          <p className="mb-2 text-[10px] text-gray-600">Arrastrá para reordenar · Toggle para ocultar</p>
          <div className="flex flex-col gap-0.5">
            {draggableOrder.map((panelId, index) => {
              const meta = PANEL_META[panelId]
              if (!meta) return null
              const Icon = meta.icon
              const label = meta.label
              const isHidden = hiddenPanels.includes(panelId)

              return (
                <div
                  key={panelId}
                  draggable
                  onDragStart={(e) => onDragStart(e, index)}
                  onDragOver={onDragOver}
                  onDrop={(e) => onDrop(e, index)}
                  onDragEnd={onDragEnd}
                  className={`flex items-center gap-2 rounded-md px-2 py-1.5 select-none transition-colors ${
                    dragIndex === index
                      ? "bg-white/15 opacity-50"
                      : "hover:bg-white/5"
                  } ${isHidden ? "opacity-50" : ""}`}
                >
                  <GripVertical size={13} className="shrink-0 cursor-grab text-gray-700 active:cursor-grabbing" />
                  <Icon size={13} className="shrink-0 text-gray-500" />
                  <span className="flex-1 text-xs text-gray-300">{label}</span>

                  {/* Toggle switch */}
                  <button
                    onClick={() => toggleHiddenPanel(panelId)}
                    title={isHidden ? "Mostrar" : "Ocultar"}
                    className={`relative h-4 w-7 rounded-full transition-colors ${
                      isHidden ? "bg-white/10" : ""
                    }`}
                    style={!isHidden ? { backgroundColor: accentHex } : undefined}
                  >
                    <span
                      className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform ${
                        !isHidden ? "translate-x-[14px]" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              )
            })}
          </div>
        </section>
        )}

        {/* ── C. Comportamiento ─────────────────────────────────────────────── */}
        {currentTab === "behavior" && (
        <section>
          <SectionHeader title="Comportamiento" />

          {/* Ubicación de la barra — el anclaje AppBar se captura al cargar el
              frontend (INITIAL_SIDEBAR_POSITION); recargar el WebView re-ejecuta
              register_appbar con el nuevo borde. No usar restart_app: en dev,
              relanzar el proceso mata el server de Vite (el CLI de tauri dev
              muere con el proceso original) y la instancia nueva queda en
              ERR_CONNECTION_REFUSED. */}
          <div className="mb-4">
            <p className="mb-2 text-xs text-gray-400">Ubicación de la barra</p>
            <div className="grid grid-cols-2 gap-1.5">
              {POSITION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSidebarPosition(opt.value)}
                  className={`rounded-md px-2 py-1.5 text-[11px] transition-colors ${
                    sidebarPosition === opt.value
                      ? "text-gray-100"
                      : "bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300"
                  }`}
                  style={sidebarPosition === opt.value ? { backgroundColor: `${accentHex}33` } : undefined}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {sidebarPosition !== INITIAL_SIDEBAR_POSITION && (
              <div className="mt-2 rounded-md bg-white/5 p-2.5">
                <p className="mb-2 text-[10px] text-gray-500">
                  El cambio se aplica al recargar la barra.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="flex w-full items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-medium text-gray-100 transition-opacity hover:opacity-90"
                  style={{ backgroundColor: accentHex }}
                >
                  <RotateCcw size={12} />
                  Aplicar ahora
                </button>
              </div>
            )}
          </div>

          <div className="mb-4">
            <p className="mb-2 text-xs text-gray-400">Intervalo de actualización</p>
            <div className="grid grid-cols-2 gap-1.5">
              {REFRESH_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setRefreshInterval(opt.value)}
                  className={`rounded-md px-2 py-1.5 text-[11px] transition-colors ${
                    refreshInterval === opt.value
                      ? "text-gray-100"
                      : "bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300"
                  }`}
                  style={refreshInterval === opt.value ? { backgroundColor: `${accentHex}33` } : undefined}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-xs text-gray-400">Ancho del panel</p>
              <span className="font-mono text-[11px] text-gray-500">{panelWidth}px</span>
            </div>
            {/* Custom slider: track + thumb as divs, invisible native input on top for events */}
            <div className="relative flex h-5 items-center">
              {/* Track */}
              <div className="pointer-events-none absolute inset-x-0 h-1 rounded-full bg-white/10">
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${((panelWidth - 200) / 300) * 100}%`,
                    backgroundColor: accentHex,
                  }}
                />
              </div>
              {/* Thumb */}
              <div
                className="pointer-events-none absolute h-4 w-4 rounded-full shadow-md"
                style={{
                  left: `calc(${((panelWidth - 200) / 300) * 100}% - 8px)`,
                  backgroundColor: accentHex,
                }}
              />
              {/* Native input (invisible, captures mouse events) */}
              <input
                type="range"
                min={200}
                max={500}
                step={10}
                value={panelWidth}
                onChange={(e) => setPanelWidth(Number(e.target.value))}
                className="absolute inset-0 w-full cursor-pointer opacity-0"
              />
            </div>
            <div className="mt-0.5 flex justify-between text-[9px] text-gray-700">
              <span>200px</span><span>500px</span>
            </div>
          </div>
        </section>
        )}

        {/* ── D. Sesión ─────────────────────────────────────────────────────── */}
        {currentTab === "session" && isAuthenticated && (
          <section>
            <SectionHeader title="Sesión" />
            {user?.email && (
              <p className="mb-3 truncate text-[11px] text-gray-500">{user.email}</p>
            )}
            {!confirmLogout ? (
              <button
                onClick={() => setConfirmLogout(true)}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-red-600/20 px-3 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-600/30"
              >
                <LogOut size={13} />
                Cerrar sesión
              </button>
            ) : (
              <div className="rounded-md bg-red-600/10 p-3">
                <p className="mb-2 text-center text-xs text-gray-400">¿Cerrar sesión?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmLogout(false)}
                    className="flex-1 rounded-md bg-white/10 py-1.5 text-[11px] text-gray-300 transition-colors hover:bg-white/15"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex-1 rounded-md bg-red-600 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60"
                  >
                    {isLoggingOut ? "Cerrando..." : "Confirmar"}
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── E. Acerca de ──────────────────────────────────────────────────── */}
        {currentTab === "about" && (
        <section>
          <SectionHeader title="Acerca de" />

          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info size={13} className="text-gray-600" />
              <span className="text-xs text-gray-400">Versión</span>
            </div>
            <span className="font-mono text-xs text-gray-500">{appVersion}</span>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2">
              <Keyboard size={13} className="text-gray-600" />
              <span className="text-xs text-gray-400">Atajos de teclado</span>
            </div>
            <div className="rounded-md bg-white/5 p-2.5 space-y-2">
              {[
                { key: "Clic en ícono activo",  action: "Cerrar panel" },
                {
                  key: INITIAL_SIDEBAR_POSITION === "left" ? "Arrastrar borde der." : "Arrastrar borde izq.",
                  action: "Redimensionar",
                },
              ].map(({ key, action }) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-gray-400">
                    {key}
                  </span>
                  <span className="text-[10px] text-gray-600">{action}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
        )}

      </div>
    </div>
  )
}
