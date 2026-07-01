import { useState, useEffect } from "react"
import {
  Home, Files, MessageSquare, Bell, Code2, CheckSquare,
  StickyNote, Users, Bookmark, FolderKanban, CalendarDays, User,
  GripVertical, LogOut, Info, Keyboard, Sparkles,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { getVersion } from "@tauri-apps/api/app"
import { useSettingsStore } from "../../store/settingsStore"
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

// ─── Refresh interval options ─────────────────────────────────────────────────
const REFRESH_OPTIONS = [
  { value: 30,  label: "30 seg" },
  { value: 60,  label: "1 min"  },
  { value: 120, label: "2 min"  },
  { value: 0,   label: "Manual" },
]

// ─── Panel meta ───────────────────────────────────────────────────────────────
const PANEL_META: Partial<Record<PanelId, { icon: LucideIcon; label: string }>> = {
  home:      { icon: Home,          label: "Home"      },
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
  profile:   { icon: User,          label: "Perfil"    },
}

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
    sidebarOrder, setSidebarOrder,
    hiddenPanels, toggleHiddenPanel,
    refreshInterval, setRefreshInterval,
    panelWidth, setPanelWidth,
  } = useSettingsStore()

  const [appVersion,    setAppVersion]    = useState<string>("...")
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [isLoggingOut,  setIsLoggingOut]  = useState(false)
  const [dragIndex,     setDragIndex]     = useState<number | null>(null)

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

  // sidebarOrder never includes "settings" (it lives at bottom always)
  const draggableOrder = sidebarOrder.filter((id) => id !== "settings")

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 border-b border-white/10 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-100">Configuración</h2>
      </header>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-5">

        {/* ── A. Apariencia ─────────────────────────────────────────────────── */}
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
          <div>
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
        </section>

        {/* ── B. Sidebar ────────────────────────────────────────────────────── */}
        <section>
          <SectionHeader title="Sidebar" />
          <p className="mb-2 text-[10px] text-gray-600">Arrastrá para reordenar · Toggle para ocultar</p>
          <div className="flex flex-col gap-0.5">
            {draggableOrder.map((panelId, index) => {
              const meta = PANEL_META[panelId]
              if (!meta) return null
              const Icon = meta.icon
              const label = meta.label
              const isHidden    = hiddenPanels.includes(panelId)
              const isProtected = panelId === "home"

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
                    onClick={() => { if (!isProtected) toggleHiddenPanel(panelId) }}
                    disabled={isProtected}
                    title={isProtected ? "Siempre visible" : (isHidden ? "Mostrar" : "Ocultar")}
                    className={`relative h-4 w-7 rounded-full transition-colors ${
                      isProtected ? "cursor-not-allowed opacity-30 bg-white/10"
                      : !isHidden  ? ""
                      : "bg-white/10"
                    }`}
                    style={!isProtected && !isHidden ? { backgroundColor: accentHex } : undefined}
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

        {/* ── C. Comportamiento ─────────────────────────────────────────────── */}
        <section>
          <SectionHeader title="Comportamiento" />

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

        {/* ── D. Sesión ─────────────────────────────────────────────────────── */}
        {isAuthenticated && (
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
                { key: "Arrastrar borde izq.",   action: "Redimensionar" },
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

      </div>
    </div>
  )
}
